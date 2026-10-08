<?php
/**
 * WOWCCM 보이는 방송(유튜브 라이브) 상태 API
 *
 * 올릴 위치: https://wowccm.net/wowcast/youtube_live.php
 * 응답 예:   {"live":true,"videoId":"abc","url":"https://www.youtube.com/watch?v=abc","title":"...","checkedAt":"..."}
 *
 * - API 키는 이 파일이 아니라 youtube_live.config.php 에 둔다 (공개 저장소에 올리지 않기 위해).
 * - 실제 확인은 youtube_live.lib.php 가 한다 (웹 플레이어의 video-live.php 와 함께 쓴다).
 * - 결과를 60초 동안 저장해 두므로, 청취자가 몇 명이든 유튜브에는 1분에 한 번만 묻는다.
 * - 1회 확인 비용: playlistItems 1 + videos 1 = 2 유닛 (하루 약 2,880 유닛, 무료 한도 10,000)
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/youtube_live.lib.php';

// 점검: youtube_live.php?diag=1 (서버 환경과 Google 접속 여부만 보여 준다. 키는 보여 주지 않음)
if (isset($_GET['diag'])) {
    $diag = [
        'php' => PHP_VERSION,
        'curl' => function_exists('curl_init'),
        'allow_url_fopen' => (bool)ini_get('allow_url_fopen'),
        'openssl' => extension_loaded('openssl'),
        'config_file' => is_file(__DIR__ . '/youtube_live.config.php'),
        'cache_dir_writable' => is_writable(sys_get_temp_dir()),
    ];
    try {
        wowccm_http_get('https://www.googleapis.com/youtube/v3/videos');
        $diag['google_connect'] = 'ok';
    } catch (Throwable $e) {
        $diag['google_connect'] = $e->getMessage();
    }
    echo json_encode($diag, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(wowccm_live_status_from_config(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
