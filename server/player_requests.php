<?php
/**
 * WOWCCM 플레이어 전용: 사연&신청곡 최근 목록
 *
 * 올릴 위치: https://wowccm.net/wowcast/player_requests.php
 * 사용 예:   player_requests.php?limit=7
 * 응답 예:   {"ok":true,"items":[{"name":"원혜영","content":"…","day":"09-29","clock":"15:59"}, …]}
 *
 * - 기존 wow_mini_test_v2.php 는 건드리지 않고, 앱이 쓸 목록만 따로 만든다.
 * - 그누보드 설정(common.php)을 불러와 사연 게시판에서 최근 글을 읽는다.
 * - 비밀글과 댓글은 보여 주지 않는다.
 */

// ▼ 사연&신청곡 게시판 이름 (게시판 주소의 bo_table= 뒤에 오는 값)
const WOWCCM_REQUEST_BOARD = '';

const WOWCCM_DEFAULT_LIMIT = 7;
const WOWCCM_MAX_LIMIT = 20;

/** 게시판 글 행들을 앱에 보낼 형태로 바꾼다 (그누보드 없이도 시험할 수 있게 따로 둔다) */
function wowccm_format_requests(array $rows): array
{
    $items = [];
    foreach ($rows as $r) {
        if (strpos((string)($r['wr_option'] ?? ''), 'secret') !== false) continue;
        $content = (string)($r['wr_content'] ?? '');
        $content = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', '', $content);
        $content = preg_replace('#<br\s*/?>#i', "\n", $content);
        $content = html_entity_decode(strip_tags($content), ENT_QUOTES, 'UTF-8');
        $content = trim(preg_replace("/[ \t]+/", ' ', $content));
        $dt = strtotime((string)($r['wr_datetime'] ?? '')) ?: 0;
        $items[] = [
            'name' => trim(html_entity_decode(strip_tags((string)($r['wr_name'] ?? '')), ENT_QUOTES, 'UTF-8')),
            'content' => $content,
            'day' => $dt ? date('m-d', $dt) : '',
            'clock' => $dt ? date('H:i', $dt) : '',
        ];
    }
    return $items;
}

// 시험 코드에서 함수만 불러갈 때는 여기서 멈춘다
if (defined('WOWCCM_TEST')) return;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (WOWCCM_REQUEST_BOARD === '' || !preg_match('/^[A-Za-z0-9_]+$/', WOWCCM_REQUEST_BOARD)) {
    echo json_encode(['ok' => false, 'error' => 'board_not_configured']);
    exit;
}

$limit = (int)($_GET['limit'] ?? WOWCCM_DEFAULT_LIMIT);
$limit = max(1, min(WOWCCM_MAX_LIMIT, $limit ?: WOWCCM_DEFAULT_LIMIT));

// 그누보드 설정 불러오기 (DB 연결, 테이블 이름 등)
$common = dirname(__DIR__) . '/common.php';
if (!is_file($common)) {
    echo json_encode(['ok' => false, 'error' => 'common_php_not_found']);
    exit;
}
include_once $common;

$prefix = $g5['write_prefix'] ?? ($g4['write_prefix'] ?? 'g5_write_');
$table = $prefix . WOWCCM_REQUEST_BOARD;

$rows = [];
$result = sql_query(
    "select wr_name, wr_content, wr_datetime, wr_option
       from `{$table}`
      where wr_is_comment = 0
      order by wr_id desc
      limit " . ($limit * 2),
    false
);
if (!$result) {
    echo json_encode(['ok' => false, 'error' => 'board_query_failed']);
    exit;
}
while ($row = sql_fetch_array($result)) {
    $rows[] = $row;
}

// 비밀글을 걸러 내도 개수가 모자라지 않도록 넉넉히 읽은 뒤 자른다
$items = array_slice(wowccm_format_requests($rows), 0, $limit);
echo json_encode(['ok' => true, 'items' => $items], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
