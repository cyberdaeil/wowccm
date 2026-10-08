<?php
/**
 * 웹 플레이어(/renew/player/)의 보이는 라디오 상태
 *
 * 올릴 위치: https://wowccm.net/renew/player/video-live.php (기존 파일을 바꿔 끼운다)
 * 응답 예:   {"live":true,"available":true,"url":"https://www.youtube.com/watch?v=abc","checked_at":1791466536}
 *   - live:      지금 유튜브 생방송 중인가
 *   - available: 확인에 성공했는가 (false면 화면은 회색 + 채널 라이브 주소)
 *
 * 직접 유튜브에 묻지 않고, 와플 플레이어와 같은 /wowcast/youtube_live.lib.php 를 쓴다.
 * 두 플레이어가 같은 저장 파일을 쓰므로 유튜브에는 1분에 한 번만 묻는다 (API 하루 약 2,880 유닛).
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const CHANNEL_LIVE_URL = 'https://www.youtube.com/@wowccm/live';

$lib = null;
foreach ([
    __DIR__ . '/../../wowcast/youtube_live.lib.php',
    rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . '/wowcast/youtube_live.lib.php',
] as $path) {
    if (is_file($path)) { $lib = $path; break; }
}

$status = ['live' => false, 'error' => 'lib_not_found'];
if ($lib) {
    require_once $lib;
    try {
        $status = wowccm_live_status_from_config();
    } catch (Throwable $e) {
        $status = ['live' => false, 'error' => 'check_failed'];
    }
}

$available = empty($status['error']);
$live = $available && ($status['live'] ?? false) === true && !empty($status['videoId']);
$checkedAt = isset($status['checkedAt']) ? strtotime($status['checkedAt']) : false;

$out = [
    'live' => $live,
    'available' => $available,
    'url' => $live ? 'https://www.youtube.com/watch?v=' . rawurlencode($status['videoId']) : CHANNEL_LIVE_URL,
    'checked_at' => $checkedAt ?: time(),
];
// 점검용: video-live.php?diag=1 이면 원인을 함께 보여 준다 (키는 담지 않는다)
if (isset($_GET['diag'])) {
    $out['source'] = $lib ? 'youtube_live.lib.php' : null;
    $out['error'] = $status['error'] ?? null;
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
