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
  /* Windows 설치 안내: 실제 "Windows의 PC 보호" 창을 흉내 낸 그림 */
  .guide { text-align: left; margin-top: 26px; padding-top: 22px; border-top: 1px solid #ededf0; }
  .guide h2 { font-size: 16px; margin: 0 0 6px; letter-spacing: -0.3px; }
  .guide .sub { font-size: 13px; color: #6b6b72; margin: 0 0 16px; line-height: 1.6; }
  .step { margin: 0 0 18px; }
  .step-title { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
  .step-title span { display: inline-block; width: 22px; height: 22px; line-height: 22px; border-radius: 50%; background: #E95017; color: #fff; text-align: center; font-size: 12px; margin-right: 6px; }
  .ss { background: #0f5ea8; color: #fff; border-radius: 6px; padding: 18px 18px 14px; font-family: "Segoe UI", "Malgun Gothic", sans-serif; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
  .ss-title { font-size: 19px; font-weight: 300; margin: 0 0 10px; }
  .ss-text { font-size: 12px; line-height: 1.6; opacity: .95; margin: 0 0 10px; }
  .ss-meta { font-size: 12px; line-height: 1.8; margin: 0 0 12px; }
  .ss-link { font-size: 12px; text-decoration: underline; display: inline-block; padding: 2px 4px; }
  .ss-btns { text-align: right; margin-top: 12px; }
  .ss-btn { display: inline-block; min-width: 70px; padding: 6px 12px; margin-left: 6px; border: 1px solid #fff; font-size: 12px; text-align: center; }
  .ss-btn.dim { opacity: .55; }
  .hl { outline: 3px solid #ffd54a; outline-offset: 2px; border-radius: 3px; position: relative; }
  .hl-tag { display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 10px; background: #ffd54a; color: #3a2c00; font-size: 11px; font-weight: 700; text-decoration: none; }
  .note { font-size: 12px; color: #6b6b72; line-height: 1.7; background: #f7f7f8; border-radius: 10px; padding: 12px 14px; }
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

    <div class="guide">
      <h2>Windows에서 설치할 때</h2>
      <p class="sub">받은 파일을 실행하면 아래와 같은 <b>파란 창</b>이 뜰 수 있습니다.<br>
      와우씨씨엠이 만든 안전한 프로그램이니, 두 번만 누르시면 됩니다.</p>

      <div class="step">
        <p class="step-title"><span>1</span><b>추가 정보</b>를 누르세요</p>
        <div class="ss">
          <p class="ss-title">Windows의 PC 보호</p>
          <p class="ss-text">Microsoft Defender SmartScreen에서 인식할 수 없는 앱의 시작을 차단했습니다. 이 앱을 실행하면 PC가 위험에 노출될 수 있습니다.</p>
          <span class="ss-link hl">추가 정보</span><span class="hl-tag">여기를 누르세요</span>
          <div class="ss-btns"><span class="ss-btn dim">실행 안 함</span></div>
        </div>
      </div>

      <div class="step">
        <p class="step-title"><span>2</span><b>실행</b>을 누르세요</p>
        <div class="ss">
          <p class="ss-title">Windows의 PC 보호</p>
          <p class="ss-text">Microsoft Defender SmartScreen에서 인식할 수 없는 앱의 시작을 차단했습니다. 이 앱을 실행하면 PC가 위험에 노출될 수 있습니다.</p>
          <p class="ss-meta">앱: WOWCCM…setup.exe<br>게시자: 알 수 없는 게시자</p>
          <div class="ss-btns"><span class="hl-tag">여기를 누르세요</span><span class="ss-btn hl">실행</span><span class="ss-btn dim">실행 안 함</span></div>
        </div>
      </div>

      <p class="note">
        · 이 창은 새 프로그램이라 Windows가 아직 잘 모르기 때문에 나옵니다. 설치하는 분이 많아지면 뜨지 않게 됩니다.<br>
        · 이전 와우씨씨엠 플레이어가 있으면 설치 중에 <b>삭제할지</b> 물어봅니다. 새 플레이어만 쓰시면 되니 <b>예</b>를 누르세요.<br>
        · 설치가 끝나면 플레이어가 켜지고 바로 방송이 나옵니다.
      </p>

      <h2 style="margin-top:22px">Mac</h2>
      <p class="sub" style="margin:0">받은 파일을 열고 앱을 <b>응용 프로그램</b> 폴더로 끌어 놓으세요.<br>
      Apple의 확인(공증)을 받은 앱이라 바로 열립니다.</p>
    </div>
  </div>
</div>
</body>
</html>
