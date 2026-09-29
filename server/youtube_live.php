<?php
/**
 * WOWCCM 보이는 방송(유튜브 라이브) 상태 API
 *
 * 올릴 위치: https://wowccm.net/wowcast/youtube_live.php
 * 응답 예:   {"live":true,"videoId":"abc","url":"https://www.youtube.com/watch?v=abc","title":"...","checkedAt":"..."}
 *
 * - API 키는 이 파일이 아니라 youtube_live.config.php 에 둔다 (공개 저장소에 올리지 않기 위해).
 * - 결과를 CACHE_TTL 초 동안 저장해 두므로, 청취자가 몇 명이든 유튜브에는 1분에 한 번만 묻는다.
 * - 1회 확인 비용: playlistItems 1 + videos 1 = 2 유닛 (하루 약 2,880 유닛, 무료 한도 10,000)
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const CACHE_TTL = 60;          // 초
const ERROR_TTL = 30;          // 오류가 나면 30초 뒤 다시 시도
const RECENT_VIDEOS = 10;      // 최근 업로드 몇 개를 살펴볼지

$config = @include __DIR__ . '/youtube_live.config.php';
if (!is_array($config) || empty($config['api_key'])) {
    echo json_encode(['live' => false, 'error' => 'not_configured']);
    exit;
}
$apiKey = $config['api_key'];
$handle = $config['handle'] ?? '@wowccm';
$cacheFile = $config['cache_file'] ?? (sys_get_temp_dir() . '/wowccm_youtube_live.json');

echo json_encode(wowccm_live_status($apiKey, $handle, $cacheFile), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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
                'maxResults' => RECENT_VIDEOS,
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
                'expires' => time() + CACHE_TTL,
            ]);
            return $result;
        } catch (Throwable $e) {
            $result = ['live' => false, 'error' => $e->getMessage(), 'checkedAt' => date('c')];
            wowccm_write_cache($cacheFile, [
                'uploads' => $cache['uploads'] ?? null,
                'channelId' => $cache['channelId'] ?? null,
                'result' => $result,
                'expires' => time() + ERROR_TTL,
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
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) throw new RuntimeException('youtube_unreachable');
    $data = json_decode($body, true);
    if (!is_array($data)) throw new RuntimeException('youtube_bad_response');
    if (isset($data['error'])) {
        // quotaExceeded, keyInvalid 등
        throw new RuntimeException($data['error']['errors'][0]['reason'] ?? 'youtube_error');
    }
    return $data;
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
