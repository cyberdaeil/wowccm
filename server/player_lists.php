<?php
/**
 * WOWCCM 와플 전용: 진행 중인 이벤트 / 다시듣기 목록
 *
 * 올릴 위치: https://wowccm.net/wowcast/player_lists.php
 * 사용 예:
 *   player_lists.php?type=events          진행 중인 이벤트 (이벤트 기간 안에 있는 글)
 *   player_lists.php?type=recasts&limit=8 다시듣기 최근 회차
 *   뒤에 &diag=1 을 붙이면 판단 근거를 함께 보여 준다 (점검용)
 *
 * - 이벤트 글은 비밀글이어도 제목은 게시판 목록에 보이므로 제목·주소만 내보낸다. 본문은 내보내지 않는다.
 * - 이벤트 기간은 제목과 본문에 적힌 "진행 기간: 2026.10.21 ~ 2026.11.05", "10/31까지" 같은 글자에서 읽는다.
 *   본문에 없으면 게시판의 여분 칸(wr_1~wr_10)에 들어 있는 날짜(응모 기간 칸)를 쓴다.
 *   그래도 없으면 올린 지 60일 안의 글만 진행 중으로 본다.
 * - 제목이 [종료], [마감], [당첨자발표], [결과]로 시작하면 기간과 상관없이 끝난 이벤트로 본다.
 */

const WOWCCM_EVENT_BOARD = 'event';
const WOWCCM_RECAST_BOARD = 'recast';
const WOWCCM_EVENT_FALLBACK_DAYS = 60;
const WOWCCM_RECAST_DEFAULT = 8;
const WOWCCM_RECAST_MAX = 20;

function wowccm_tz(): DateTimeZone
{
    return new DateTimeZone('Asia/Seoul');
}

/** HTML 본문 → 한 줄 글자 */
function wowccm_plain(string $html): string
{
    $s = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', ' ', $html);
    $s = preg_replace('#<(br|/p|/div|/li|/tr)\b[^>]*>#i', "\n", $s);
    $s = html_entity_decode(strip_tags($s), ENT_QUOTES, 'UTF-8');
    $s = str_replace("\xC2\xA0", ' ', $s);
    return trim(preg_replace('/[ \t]+/u', ' ', $s));
}

/** 끝난 이벤트 제목인가 */
function wowccm_event_ended_title(string $title): bool
{
    return (bool)preg_match('/^\s*[\[(【]\s*(종료|마감|결과|당첨자\s*발표)/u', $title);
}

/**
 * 글자에서 이벤트 기간을 찾는다. [시작, 끝] (DateTimeImmutable 또는 null). 못 찾으면 null.
 * 연도가 없으면 올린 날짜 기준으로 정한다 (올린 날보다 한 달 넘게 앞서면 다음 해로 본다).
 */
function wowccm_event_period(string $text, DateTimeImmutable $posted): ?array
{
    $date = '/(?:(20\d\d)\s*(?:[.\-\/]|년)\s*)?(\d{1,2})\s*(?:[.\-\/]|월)\s*(\d{1,2})(?!\d)\s*일?/u';
    // 앞의 것일수록 믿을 만한 표시
    $keys = [
        '/(?:이벤트|응모|참여|신청|접수|모집)\s*기\s*간/u',
        '/기\s*간/u',
        '/마\s*감/u',
        '/까\s*지/u',
    ];
    foreach ($keys as $k) {
        if (!preg_match_all($k, $text, $mm, PREG_OFFSET_CAPTURE)) continue;
        foreach ($mm[0] as [$word, $pos]) {
            // "~ 10월 31일까지"는 낱말 앞에, "기간: 10월 1일 ~ 31일"은 낱말 뒤에 날짜가 온다
            $isUntil = strpos($word, '까') !== false;
            $from = $isUntil ? max(0, $pos - 60) : $pos;
            $len = $isUntil ? ($pos - $from) + strlen($word) : 120;
            $window = substr($text, $from, $len);
            // 기간 줄 하나만 본다 (다음 줄의 "당첨자 발표 11월 5일" 등을 섞지 않도록)
            if (!$isUntil) $window = explode("\n", $window)[0];
            else $window = substr($window, (int)strrpos("\n" . $window, "\n"));
            $window = mb_convert_encoding($window, 'UTF-8', 'UTF-8'); // 잘린 글자 정리
            if (!preg_match_all($date, $window, $dm, PREG_SET_ORDER)) continue;
            $dates = [];
            $year = (int)$posted->format('Y');
            foreach ($dm as $d) {
                $y = $d[1] !== '' ? (int)$d[1] : $year;
                $m = (int)$d[2];
                $day = (int)$d[3];
                if ($m < 1 || $m > 12 || $day < 1 || $day > 31) continue;
                $dt = DateTimeImmutable::createFromFormat('!Y-n-j', "$y-$m-$day", wowccm_tz());
                if (!$dt) continue;
                if ($d[1] === '' && $dt < $posted->modify('-31 days')) $dt = $dt->modify('+1 year');
                $year = (int)$dt->format('Y'); // "2026.12.20 ~ 1.5"처럼 해를 넘기는 기간 대비
                $dates[] = $dt;
            }
            if (!$dates) continue;
            $start = count($dates) > 1 ? $dates[0] : null;
            $end = end($dates)->setTime(23, 59, 59);
            if ($start && $start > $end) $start = null;
            return [$start, $end];
        }
    }
    return null;
}

/**
 * 이벤트 게시판 여분 칸(wr_1~wr_10)의 날짜로 기간을 정한다.
 * 칸 하나에 "2026.10.21 ~ 2026.11.05"가 함께 있으면 그 칸을, 아니면 날짜만 든 칸 처음 두 개를 시작·끝으로 본다.
 */
function wowccm_event_period_fields(array $r): ?array
{
    $one = '(20\d\d)\s*[.\-\/년]\s*(\d{1,2})\s*[.\-\/월]\s*(\d{1,2})';
    $mk = static function (array $m, int $o) {
        return DateTimeImmutable::createFromFormat('!Y-n-j', "{$m[$o]}-{$m[$o + 1]}-{$m[$o + 2]}", wowccm_tz()) ?: null;
    };
    $single = [];
    for ($i = 1; $i <= 10; $i++) {
        $v = trim(strip_tags((string)($r["wr_$i"] ?? '')));
        if ($v === '') continue;
        if (preg_match("/$one\s*[~∼\-–]\s*$one/u", $v, $m)) {
            $s = $mk($m, 1);
            $e = $mk($m, 4);
            if ($s && $e && $s <= $e) return [$s, $e->setTime(23, 59, 59)];
        }
        if (preg_match("/^$one(?:\s*\(.\))?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/u", $v, $m) && ($d = $mk($m, 1))) {
            $single[] = $d;
        }
    }
    if (count($single) >= 2 && $single[0] <= $single[1]) return [$single[0], $single[1]->setTime(23, 59, 59)];
    return null;
}

/** 이벤트 글 행들 → 진행 중인 이벤트 (그누보드 없이 시험할 수 있게 따로 둔다) */
function wowccm_active_events(array $rows, DateTimeImmutable $now, string $boardUrl, bool $diag = false): array
{
    $items = [];
    $checked = [];
    foreach ($rows as $r) {
        $title = trim(html_entity_decode(strip_tags((string)($r['wr_subject'] ?? '')), ENT_QUOTES, 'UTF-8'));
        $posted = new DateTimeImmutable((string)($r['wr_datetime'] ?? 'now'), wowccm_tz());
        $period = null;
        if (wowccm_event_ended_title($title)) {
            $active = false;
            $why = 'ended_title';
        } else {
            $period = wowccm_event_period($title . "\n" . wowccm_plain((string)($r['wr_content'] ?? '')), $posted)
                ?? wowccm_event_period_fields($r);
            if ($period) {
                [$start, $end] = $period;
                $active = (!$start || $now >= $start) && $now <= $end;
                $why = $active ? 'in_period' : ($start && $now < $start ? 'not_started' : 'period_over');
            } else {
                $active = $now->getTimestamp() - $posted->getTimestamp() <= WOWCCM_EVENT_FALLBACK_DAYS * 86400;
                $why = $active ? 'no_period_recent' : 'no_period_old';
            }
        }
        $item = [
            'title' => $title,
            'link' => $boardUrl . '&wr_id=' . (int)$r['wr_id'],
            'date' => $posted->format('m-d'),
            'start' => $period && $period[0] ? $period[0]->format('Y-m-d') : null,
            'end' => $period ? $period[1]->format('Y-m-d') : null,
            'secret' => strpos((string)($r['wr_option'] ?? ''), 'secret') !== false,
        ];
        if ($active) $items[] = $item;
        if ($diag) {
            $extra = [];
            for ($i = 1; $i <= 10; $i++) {
                $v = trim(strip_tags((string)($r["wr_$i"] ?? '')));
                if ($v !== '') $extra["wr_$i"] = mb_substr($v, 0, 40);
            }
            $checked[] = $item + ['active' => $active, 'why' => $why, 'extra' => $extra];
        }
    }
    return $diag ? ['items' => $items, 'checked' => $checked] : ['items' => $items];
}

/** 글 안에서 mp3 주소 찾기 (링크 칸 → 여분 칸 → 본문 순서) */
function wowccm_find_audio(array $r): string
{
    $fields = ['wr_link1', 'wr_link2'];
    for ($i = 1; $i <= 10; $i++) $fields[] = "wr_$i";
    $fields[] = 'wr_content';
    foreach ($fields as $f) {
        $v = html_entity_decode((string)($r[$f] ?? ''), ENT_QUOTES, 'UTF-8');
        if (preg_match('#https?://[^\s"\'<>]+?\.mp3\b#i', $v, $m)) return $m[0];
    }
    return '';
}

/** 다시듣기 글 행들 → 목록 */
function wowccm_recasts(array $rows, int $limit): array
{
    $items = [];
    foreach ($rows as $r) {
        if (strpos((string)($r['wr_option'] ?? ''), 'secret') !== false) continue;
        $audio = wowccm_find_audio($r);
        if ($audio === '') continue;
        $date = trim(html_entity_decode(strip_tags((string)($r['wr_subject'] ?? '')), ENT_QUOTES, 'UTF-8'));
        $program = trim((string)($r['ca_name'] ?? ''));
        if ($program === '') {
            // 본문 "엘샤인의 샤인데이 10월 19일 방송" → "엘샤인의 샤인데이"
            $first = explode("\n", wowccm_plain((string)($r['wr_content'] ?? '')))[0];
            $program = trim(preg_replace('/\s*\d{1,2}\s*월\s*\d{1,2}\s*일.*$/u', '', $first));
        }
        $items[] = ['program' => $program, 'date' => $date, 'audio' => $audio];
        if (count($items) >= $limit) break;
    }
    return $items;
}

// 시험 코드에서 함수만 불러갈 때는 여기서 멈춘다
if (defined('WOWCCM_TEST')) return;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$type = $_GET['type'] ?? '';
$diag = isset($_GET['diag']);
if (!in_array($type, ['events', 'recasts'], true)) {
    echo json_encode(['ok' => false, 'error' => 'type_required']);
    exit;
}

$common = dirname(__DIR__) . '/common.php';
if (!is_file($common)) {
    echo json_encode(['ok' => false, 'error' => 'common_php_not_found']);
    exit;
}
include_once $common;
$prefix = $g5['write_prefix'] ?? ($g4['write_prefix'] ?? 'g5_write_');
$out = static function (array $data) {
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
};
$read = static function (string $sql) {
    $res = sql_query($sql, false);
    if (!$res) {
        echo json_encode(['ok' => false, 'error' => 'board_query_failed']);
        exit;
    }
    $rows = [];
    while ($row = sql_fetch_array($res)) $rows[] = $row;
    return $rows;
};

if ($type === 'events') {
    $rows = $read("select *
                     from `{$prefix}" . WOWCCM_EVENT_BOARD . "`
                    where wr_is_comment = 0
                    order by wr_id desc
                    limit 20");
    $boardUrl = 'https://wowccm.net/bbs/board.php?bo_table=' . WOWCCM_EVENT_BOARD;
    $out(wowccm_active_events($rows, new DateTimeImmutable('now', wowccm_tz()), $boardUrl, $diag));
}

$limit = (int)($_GET['limit'] ?? WOWCCM_RECAST_DEFAULT);
$limit = max(1, min(WOWCCM_RECAST_MAX, $limit ?: WOWCCM_RECAST_DEFAULT));
$rows = $read("select * from `{$prefix}" . WOWCCM_RECAST_BOARD . "`
                where wr_is_comment = 0
                order by wr_id desc
                limit " . ($limit * 2));
$data = ['items' => wowccm_recasts($rows, $limit)];
if ($diag && $rows) {
    // 프로그램명·음성 주소가 어느 칸에 있는지 확인용 (본문은 앞부분만)
    $r = $rows[0];
    $fields = [];
    foreach (['ca_name', 'wr_subject', 'wr_link1', 'wr_link2', 'wr_1', 'wr_2', 'wr_3', 'wr_4', 'wr_5'] as $f) {
        if (isset($r[$f]) && $r[$f] !== '') $fields[$f] = mb_substr((string)$r[$f], 0, 120);
    }
    $fields['wr_content'] = mb_substr(wowccm_plain((string)($r['wr_content'] ?? '')), 0, 120);
    $data['first_row'] = $fields;
}
$out($data);
