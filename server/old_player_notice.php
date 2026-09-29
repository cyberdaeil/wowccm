<?php
/**
 * 이전 플레이어(v1.0) 오른쪽 칸 맨 위에 띄우는 "새 플레이어 출시" 배너
 *
 * 올릴 위치: wowcast/old_player_notice.php
 * 사용법:   /wowccm/player_inc.php 의 "<!-- 타이틀 -->" 표를 지우고 그 자리에
 *           <?php @include $_SERVER['DOCUMENT_ROOT'] . '/wowcast/old_player_notice.php'; ?>
 *           한 줄을 넣는다.
 *
 * - 이전 플레이어는 옛 인터넷 익스플로러 방식으로 화면을 그리므로 표(table)와 font만 쓴다.
 * - 원래 제목 줄과 같은 높이(17px)라서 아래 내용이 밀려 잘리지 않는다.
 * - 배너를 끄려면 아래 값을 false로 바꾸면 원래 제목 줄이 다시 나온다.
 */
$WOWCCM_SHOW_NEW_PLAYER_NOTICE = true;
$WOWCCM_DOWNLOAD_URL = 'https://wowccm.net/wowcast/player_download.php';

if ($WOWCCM_SHOW_NEW_PLAYER_NOTICE): ?>
<!-- 새 플레이어 출시 안내 -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px #E95017 solid;border-bottom:0;">
  <tr><td bgcolor="#E95017" align="center" height="17" valign="middle">
    <a href="<?php echo htmlspecialchars($WOWCCM_DOWNLOAD_URL, ENT_QUOTES); ?>" target="_blank" style="text-decoration:none;">
      <font color="#ffffff"><b>★ 새 플레이어 「WOWCCM 와플」 출시! 받기 ▶</b></font>
    </a>
  </td></tr>
</table>
<?php else: ?>
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px #e6e6e6 solid;border-bottom:0;">
  <tr><td bgcolor="#ffffff" align="center" height="17" valign="bottom">
    <font color="#666666">현재 진행중인 방송 정보입니다.</font>
  </td></tr>
</table>
<?php endif; ?>
