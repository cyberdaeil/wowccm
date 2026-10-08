<?php
/**
 * WOWCCM 보이는 방송(유튜브 라이브) 확인 함수 모음
 *
 * 올릴 위치: https://wowccm.net/wowcast/youtube_live.lib.php
 * 이 파일만 열면 아무것도 나오지 않는다. 아래 두 파일이 함께 쓴다.
 *   - /wowcast/youtube_live.php       (와플 플레이어)
 *   - /renew/player/video-live.php    (웹 플레이어)
 * 두 곳이 같은 저장 파일(캐시)을 쓰므로, 유튜브에는 1분에 한 번만 묻는다.
 */

const WOWCCM_YT_CACHE_TTL = 60;      // 초
const WOWCCM_YT_ERROR_TTL = 30;      // 오류가 나면 30초 뒤 다시 시도
const WOWCCM_YT_RECENT_VIDEOS = 10;  // 최근 업로드 몇 개를 살펴볼지

/** 설정 파일을 읽어 생방송 상태를 돌려준다. 설정이 없으면 error=not_configured */
function wowccm_live_status_from_config(): array
{
    $config = @include __DIR__ . '/youtube_live.config.php';
    if (!is_array($config) || empty($config['api_key'])) {
        return ['live' => false, 'error' => 'not_configured'];
    }
    return wowccm_live_status(
        $config['api_key'],
        $config['handle'] ?? '@wowccm',
        $config['cache_file'] ?? (sys_get_temp_dir() . '/wowccm_youtube_live.json')
    );
}

function wowccm_live_status(string $apiKey, string $handle, string $cacheFile, ?callable $fetch = null): array
{
    $fetch = $fetch ?? 'wowccm_fetch_json';
    $cache = wowccm_read_cache($cacheFile);
    if (isset($cache['result'], $cache['expires']) && $cache['expires'] > time()) {
        return $cache['result'];
    }

    // 여러 청취자가 동시에 와도 유튜브에는 한 번만 묻는다
    $lock = @fopen($cacheFile . '.lock', 'c');
    if ($lock) flock($lock, LOCK_EX);
    try {
        $cache = wowccm_read_cache($cacheFile);
        if (isset($cache['result'], $cache['expires']) && $cache['expires'] > time()) {
            return $cache['result'];
        }

        try {
            // 채널의 "업로드" 재생목록 ID는 바뀌지 않으므로 한 번만 알아내 저장한다
            $uploads = $cache['uploads'] ?? null;
            $channelId = $cache['channelId'] ?? null;
            if (!$uploads) {
                $ch = $fetch('channels', ['part' => 'contentDetails', 'forHandle' => $handle], $apiKey);
                $uploads = $ch['items'][0]['contentDetails']['relatedPlaylists']['uploads'] ?? null;
                $channelId = $ch['items'][0]['id'] ?? null;
                if (!$uploads) throw new RuntimeException('channel_not_found');
            }

            $pl = $fetch('playlistItems', [
                'part' => 'contentDetails',
                'playlistId' => $uploads,
                'maxResults' => WOWCCM_YT_RECENT_VIDEOS,
            ], $apiKey);
            $ids = [];
            foreach ($pl['items'] ?? [] as $it) {
                if (!empty($it['contentDetails']['videoId'])) $ids[] = $it['contentDetails']['videoId'];
            }

            $result = ['live' => false];
            if ($ids) {
                $vs = $fetch('videos', ['part' => 'snippet', 'id' => implode(',', $ids)], $apiKey);
                foreach ($vs['items'] ?? [] as $v) {
                    // live = 지금 방송 중, upcoming = 예약만 된 상태 (켜지 않음)
                    if (($v['snippet']['liveBroadcastContent'] ?? '') === 'live') {
                        $result = [
                            'live' => true,
                            'videoId' => $v['id'],
                            'url' => 'https://www.youtube.com/watch?v=' . $v['id'],
                            'title' => $v['snippet']['title'] ?? '',
                        ];
                        break;
                    }
                }
            }
            $result['channelId'] = $channelId;
            $result['checkedAt'] = date('c');
            wowccm_write_cache($cacheFile, [
                'uploads' => $uploads,
                'channelId' => $channelId,
                'result' => $result,
                'expires' => time() + WOWCCM_YT_CACHE_TTL,
            ]);
            return $result;
        } catch (Throwable $e) {
            $result = ['live' => false, 'error' => $e->getMessage(), 'checkedAt' => date('c')];
            wowccm_write_cache($cacheFile, [
                'uploads' => $cache['uploads'] ?? null,
                'channelId' => $cache['channelId'] ?? null,
                'result' => $result,
                'expires' => time() + WOWCCM_YT_ERROR_TTL,
            ]);
            return $result;
        }
    } finally {
        if ($lock) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

function wowccm_fetch_json(string $endpoint, array $params, string $apiKey): array
{
    $url = 'https://www.googleapis.com/youtube/v3/' . $endpoint . '?' . http_build_query($params + ['key' => $apiKey]);
    $body = wowccm_http_get($url);
    $data = json_decode($body, true);
    if (!is_array($data)) throw new RuntimeException('youtube_bad_response');
    if (isset($data['error'])) {
        // quotaExceeded, keyInvalid 등
        throw new RuntimeException($data['error']['errors'][0]['reason'] ?? 'youtube_error');
    }
    return $data;
}

/**
 * 바깥 주소 읽기. 국내 호스팅은 allow_url_fopen을 막아 둔 경우가 많아 cURL을 먼저 쓴다.
 * 실패하면 원인(예: "curl: Could not resolve host")을 오류에 담는다. 키는 담지 않는다.
 */
function wowccm_http_get(string $url): string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, // IPv6가 불안정한 서버 대비
            CURLOPT_USERAGENT => 'WOWCCM-Player-Server/1.0',
        ]);
        $body = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($body === false) throw new RuntimeException('youtube_unreachable (curl: ' . $err . ')');
        return $body;
    }
    if (!ini_get('allow_url_fopen')) {
        throw new RuntimeException('youtube_unreachable (서버에 cURL이 없고 allow_url_fopen도 꺼져 있음)');
    }
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) {
        $e = error_get_last()['message'] ?? '';
        $e = preg_replace('/key=[^&\s]+/', 'key=***', $e);
        throw new RuntimeException('youtube_unreachable (fopen: ' . $e . ')');
    }
    return $body;
}

function wowccm_read_cache(string $file): array
{
    $raw = @file_get_contents($file);
    $data = $raw ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

function wowccm_write_cache(string $file, array $data): void
{
    @file_put_contents($file . '.tmp', json_encode($data));
    @rename($file . '.tmp', $file);
}
