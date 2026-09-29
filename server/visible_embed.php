<?php
/**
 * WOWCCM 플레이어 안에서 보이는 방송(유튜브 라이브)을 보여 주는 페이지
 *
 * 올릴 위치: https://wowccm.net/wowcast/visible_embed.php?v=영상ID
 *           (영상 ID를 모르면 ?c=채널ID 로 그 채널의 현재 라이브를 보여 준다)
 *
 * 유튜브는 어느 사이트에서 영상을 불러가는지 확인되지 않으면 재생을 막는 경우가 있다.
 * 설치형 앱에는 웹사이트 주소가 없으므로, 이 페이지(wowccm.net)를 거쳐 영상을 불러온다.
 */

if (isset($_GET['check'])) {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'ok';
    return;
}

$v = preg_replace('/[^A-Za-z0-9_-]/', '', (string)($_GET['v'] ?? ''));
$v = substr($v, 0, 20);
$c = substr(preg_replace('/[^A-Za-z0-9_-]/', '', (string)($_GET['c'] ?? '')), 0, 40);
$opts = 'autoplay=1&playsinline=1&rel=0&modestbranding=1';
if ($v !== '') {
    $src = 'https://www.youtube.com/embed/' . $v . '?' . $opts;
} elseif ($c !== '') {
    $src = 'https://www.youtube.com/embed/live_stream?channel=' . $c . '&' . $opts;
    $v = $c;
}

header('Content-Type: text/html; charset=utf-8');
header('Referrer-Policy: strict-origin-when-cross-origin');
?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WOWCCM 보이는 방송</title>
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{display:block;width:100%;height:100%;border:0}
p{margin:0;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font:14px sans-serif}
</style>
</head>
<body>
<?php if ($v === ''): ?>
<p>재생할 영상이 없습니다.</p>
<?php else: ?>
<iframe src="<?= htmlspecialchars($src, ENT_QUOTES) ?>"
        title="WOWCCM 보이는 방송"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen></iframe>
<?php endif; ?>
</body>
</html>
