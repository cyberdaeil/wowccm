<?php
/**
 * WOWCCM 새 플레이어 다운로드 페이지
 *
 * 올릴 위치: https://wowccm.net/wowcast/player_download.php
 *
 * GitHub Releases에서 최신 설치 파일(Windows .exe, Mac .dmg)을 찾아 버튼으로 연결한다.
 * 새 버전을 올려도 이 페이지는 고칠 필요가 없다. (결과는 10분 동안 저장해 두고 쓴다)
 */

const WOWCCM_REPO = 'cyberdaeil/wowccm';
// 정식판(v2.0.0)이 나오기 전까지는 시험판도 보여 준다. 정식판을 올린 뒤 false로 바꾼다.
const WOWCCM_INCLUDE_PRERELEASE = true;
const WOWCCM_RELEASE_CACHE_TTL = 600;

function wowccm_http_get_json(string $url): ?array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            CURLOPT_USERAGENT => 'WOWCCM-Player-Download',
            CURLOPT_HTTPHEADER => ['Accept: application/vnd.github+json'],
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => [
            'timeout' => 8,
            'header' => "User-Agent: WOWCCM-Player-Download\r\nAccept: application/vnd.github+json\r\n",
        ]]);
        $body = @file_get_contents($url, false, $ctx);
    }
    $data = $body ? json_decode($body, true) : null;
    return is_array($data) ? $data : null;
}

/** 최신 릴리스의 설치 파일 주소 {version, windows, mac, page} */
function wowccm_latest_release(): array
{
    $cacheFile = sys_get_temp_dir() . '/wowccm_player_release.json';
    $cached = @json_decode((string)@file_get_contents($cacheFile), true);
    if (is_array($cached) && ($cached['expires'] ?? 0) > time()) return $cached['data'];

    $info = ['version' => '', 'windows' => '', 'mac' => '', 'page' => 'https://github.com/' . WOWCCM_REPO . '/releases'];
    $releases = wowccm_http_get_json('https://api.github.com/repos/' . WOWCCM_REPO . '/releases?per_page=10');
    foreach ($releases ?? [] as $r) {
        if (!empty($r['draft'])) continue;
        if (!empty($r['prerelease']) && !WOWCCM_INCLUDE_PRERELEASE) continue;
        foreach ($r['assets'] ?? [] as $a) {
            $name = $a['name'] ?? '';
            if (!$info['windows'] && preg_match('/_x64-setup\.exe$/', $name)) $info['windows'] = $a['browser_download_url'];
            if (!$info['mac'] && preg_match('/\.dmg$/', $name)) $info['mac'] = $a['browser_download_url'];
        }
        if ($info['windows'] || $info['mac']) {
            $info['version'] = $r['tag_name'] ?? '';
            $info['page'] = $r['html_url'] ?? $info['page'];
            break;
        }
    }
    // 가져오지 못했으면 오래 저장하지 않는다
    $ttl = ($info['windows'] || $info['mac']) ? WOWCCM_RELEASE_CACHE_TTL : 60;
    @file_put_contents($cacheFile, json_encode(['expires' => time() + $ttl, 'data' => $info]));
    return $info;
}

$rel = wowccm_latest_release();
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isMac = stripos($ua, 'Macintosh') !== false || stripos($ua, 'Mac OS X') !== false;

header('Content-Type: text/html; charset=utf-8');
?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>와우씨씨엠 플레이어 다운로드</title>
<style>
  body { margin: 0; background: #f5f5f6; color: #202024; font-family: -apple-system, "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 48px 20px; text-align: center; }
  .card { background: #fff; border-radius: 16px; padding: 36px 28px; box-shadow: 0 8px 28px rgba(0,0,0,.08); }
  .logo { height: 34px; }
  h1 { font-size: 22px; margin: 22px 0 8px; letter-spacing: -0.5px; }
  p.lead { margin: 0 0 26px; color: #6b6b72; font-size: 14px; line-height: 1.6; }
  .btn { display: block; margin: 0 0 12px; padding: 15px 0; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; }
  .btn-main { background: #E95017; color: #fff; }
  .btn-sub { background: #fff; color: #E95017; border: 1px solid #f1c59f; }
  .btn small { display: block; font-size: 11px; font-weight: 400; opacity: .85; margin-top: 3px; }
  .ver { margin-top: 6px; color: #9a9aa1; font-size: 12px; }
  .help { text-align: left; margin-top: 26px; padding-top: 20px; border-top: 1px solid #ededf0; font-size: 13px; line-height: 1.7; color: #555; }
  .help b { color: #202024; }
  code { background: #f3f3f5; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <img class="logo" src="/image/main/wowccm_logo.jpg" alt="WOWCCM">
    <h1>새 와우씨씨엠 플레이어</h1>
    <p class="lead">24시간 찬양방송을 더 편하게 들으세요.<br>보이는 라디오, 사연&amp;신청곡, 다시듣기, 방송시간표를 한 화면에서.</p>

<?php
$win = $rel['windows'] ? '<a class="btn %s" href="' . h($rel['windows']) . '">Windows용 다운로드<small>Windows 10 / 11</small></a>' : '';
$mac = $rel['mac'] ? '<a class="btn %s" href="' . h($rel['mac']) . '">Mac용 다운로드<small>macOS 10.15 이상 · 인텔 / 애플 실리콘</small></a>' : '';
if (!$win && !$mac) {
    echo '<a class="btn btn-main" href="' . h($rel['page']) . '">다운로드 페이지로 이동</a>';
} elseif ($isMac) {
    echo sprintf($mac, 'btn-main'), sprintf($win, 'btn-sub');
} else {
    echo sprintf($win, 'btn-main'), sprintf($mac, 'btn-sub');
}
?>
    <?php if ($rel['version']): ?><div class="ver">버전 <?= h($rel['version']) ?></div><?php endif; ?>

    <div class="help">
      <b>Windows</b><br>
      받은 파일을 실행하세요. "Windows의 PC 보호" 창이 뜨면 <b>추가 정보 → 실행</b>을 누릅니다.<br>
      이전 와우씨씨엠 플레이어가 있으면 설치 중에 삭제할지 물어봅니다.<br><br>
      <b>Mac</b><br>
      받은 파일을 열고 앱을 <b>응용 프로그램</b> 폴더로 끌어 놓으세요.<br>
      Apple의 확인(공증)을 받은 앱이라 바로 열립니다.
    </div>
  </div>
</div>
</body>
</html>
