# 서버 파일 (wowccm.net)

## youtube_live.php: 보이는 방송(유튜브 라이브) 확인

플레이어의 "보이는 방송" 버튼은 이 파일의 결과를 보고 켜집니다(주황색). 평소에는 회색입니다.

- 이 파일을 쓰는 이유는 **API 키를 앱에 넣지 않기 위해서**입니다. 앱에 넣으면 누구나 키를 꺼내 쓸 수 있습니다.
- 서버가 1분에 한 번만 유튜브에 묻습니다. 청취자가 몇 명이든 하루 사용량은 약 2,880 유닛이고, 무료 한도는 10,000 유닛입니다.
- 이 파일이 없거나 오류가 나면, 앱은 유튜브 페이지를 직접 확인하거나 편성표로 대신 판단합니다.

### 1. API 키 발급 (Google, 무료, 약 10분)

메뉴를 찾을 필요 없이 아래 주소를 **순서대로** 여세요. 와우씨씨엠 유튜브를 관리하는 Google 계정으로 로그인하면 됩니다. 다른 계정이어도 상관은 없습니다.

**① 프로젝트 만들기**: https://console.cloud.google.com/projectcreate
- 처음이면 서비스 약관 동의 창이 뜹니다. 국가는 대한민국을 고르고 동의하세요.
- 프로젝트 이름에 `wowccm-player`를 입력하고 **만들기**를 누릅니다.
- 1분쯤 기다리면 화면 오른쪽 위 알림(종 모양)에 "프로젝트 생성됨"이 뜹니다.

**② YouTube API 켜기**: https://console.cloud.google.com/apis/library/youtube.googleapis.com
- 화면 맨 위의 프로젝트 이름이 `wowccm-player`인지 확인합니다. 아니면 눌러서 바꿉니다.
- 파란 **사용** 버튼을 누릅니다. 영어 화면이면 **Enable**입니다.
- 결제(카드) 등록은 **필요 없습니다.**

**③ API 키 만들기**: https://console.cloud.google.com/apis/credentials
- 위쪽의 **+ 사용자 인증 정보 만들기**(+ CREATE CREDENTIALS)를 누르고 **API 키**를 고릅니다.
- `AIza…`로 시작하는 긴 글자가 나옵니다. 이것이 키입니다. **복사**해 두세요.

**④ 키 제한 걸기 (권장)**: 방금 만든 키 이름(예: "API 키 1")을 누릅니다.
- **API 제한사항**에서 "키 제한"을 고르고, 목록에서 **YouTube Data API v3**만 체크한 뒤 **저장**합니다.
- 키가 밖으로 새도 유튜브 조회 외에는 쓸 수 없게 막는 설정입니다. 건너뛰어도 작동은 합니다.

> 화면이 이 설명과 조금 달라도 괜찮습니다. 화면 맨 위 검색창에 `YouTube Data API v3`를 입력하면 ② 화면으로, `사용자 인증 정보`를 입력하면 ③ 화면으로 갑니다.

**⑤ 채널 핸들 확인**: 와우씨씨엠 유튜브 채널을 열면 채널 이름 아래에 `@`로 시작하는 주소가 보입니다(예: `@wowccm`). 설정 파일의 `handle`에 이 값을 넣습니다.

### 2. 서버에 올리기

1. `youtube_live.config.sample.php`를 복사해 이름을 `youtube_live.config.php`로 바꿉니다.
2. 그 안의 `'여기에_API_키'` 자리에 발급받은 키를 넣습니다.
3. 두 파일을 서버의 `wowcast/` 폴더에 올립니다.
   - `wowcast/youtube_live.php`
   - `wowcast/youtube_live.config.php`

> `youtube_live.config.php`는 키가 들어 있으므로 **GitHub에 올리지 마세요.** 저장소의 `.gitignore`에 이미 제외되어 있습니다.

### 3. 확인

브라우저에서 https://wowccm.net/wowcast/youtube_live.php 를 열어 봅니다.

| 보이는 내용 | 뜻 |
|---|---|
| `{"live":false,"checkedAt":"..."}` | 정상. 지금은 라이브가 없음 |
| `{"live":true,"videoId":"...","url":"...","title":"..."}` | 정상. 라이브 중 |
| `{"live":false,"error":"not_configured"}` | 설정 파일이 없거나 키가 비어 있음 |
| `{"live":false,"error":"keyInvalid"}` 등 | 키가 틀렸거나 제한 설정 문제 |
| `{"live":false,"error":"channel_not_found"}` | 설정 파일의 `handle`(채널 핸들)을 확인 |

결과는 서버에 1분 동안 저장해 두고 다시 씁니다. 그래서 라이브를 켠 뒤 플레이어에 반영되기까지 **최대 약 3분**이 걸릴 수 있습니다. 서버 저장 1분에 앱의 확인 주기 2분이 더해진 시간입니다.

## visible_embed.php: 플레이어 안에서 영상 재생

보이는 방송을 플레이어 안에서 보여 줄 때 이 페이지를 거칩니다.
설치형 앱에는 웹사이트 주소가 없어서, 유튜브가 영상 재생을 막는 경우가 있습니다(오류 153 등). 이 페이지를 거치면 유튜브가 wowccm.net에서 온 재생으로 인식합니다.

- 올릴 위치: `wowcast/visible_embed.php` (설정할 것은 없습니다)
- 확인 방법: https://wowccm.net/wowcast/visible_embed.php?check=1 을 열었을 때 `ok`가 보이면 정상입니다.

## player_requests.php: 앱 전용 사연 목록 (최근 7개)

기존 `wow_mini_test_v2.php`는 다른 페이지에서도 쓰고 있어서 건드리지 않습니다. 앱이 쓸 사연 목록만 이 파일에서 따로 만듭니다.

1. 파일 맨 위의 `WOWCCM_REQUEST_BOARD = ''` 따옴표 안에 **사연&신청곡 게시판 이름**을 넣습니다.
   - 게시판 이름은 홈페이지에서 사연 게시판을 열었을 때 주소의 `bo_table=` 뒤에 오는 글자입니다.
2. 파일을 `wowcast/` 폴더에 올립니다. 그누보드의 `common.php`가 한 단계 위 폴더(홈페이지 맨 위 폴더)에 있어야 합니다.
3. 확인: https://wowccm.net/wowcast/player_requests.php 를 열었을 때 `{"ok":true,"items":[…]}`가 나오면 정상입니다.

| 보이는 내용 | 뜻 |
|---|---|
| `board_not_configured` | 게시판 이름을 아직 넣지 않았음 |
| `board_query_failed` | 게시판 이름이 틀렸음 |
| `common_php_not_found` | 파일을 올린 폴더 위치가 다름 |

- 비밀글과 댓글은 보여 주지 않습니다.
- 앱은 이 파일이 없거나 오류가 나면 예전처럼 미니 페이지의 4개 목록을 씁니다.

## player_download.php: 새 플레이어 다운로드 페이지

- 올릴 위치: `wowcast/player_download.php`
- 주소: https://wowccm.net/wowcast/player_download.php
- GitHub Releases에서 **최신 설치 파일을 자동으로** 찾아 Windows / Mac 버튼으로 연결합니다. 새 버전을 올려도 이 페이지는 고칠 필요가 없습니다.
- Mac으로 들어오면 Mac 버튼이, Windows로 들어오면 Windows 버튼이 먼저(주황색) 보입니다.
- 지금은 시험판(test)도 보여 줍니다. 정식판 v2.0.0을 올린 뒤에는 파일 위쪽의 `WOWCCM_INCLUDE_PRERELEASE`를 `false`로 바꾸세요.

## old_player_notice.php: 이전 플레이어에 "새 플레이어 출시" 배너

이전 플레이어(v1.0)의 오른쪽 칸은 `/wowccm/player_inc.php` 페이지입니다. 그 맨 위 제목 줄("현재 진행중인 방송 정보입니다.")을 주황색 배너로 바꿉니다. 제목 줄과 높이가 같아서 아래 내용이 밀리지 않습니다.

1. `old_player_notice.php`를 `wowcast/` 폴더에 올립니다.
2. `/wowccm/player_inc.php`를 열어 아래 부분을 찾습니다.
   ```html
   <!-- 타이틀 -->
   <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px #e6e6e6 solid;border-bottom:0;">
     <tr><td bgcolor="#ffffff" align="center" height="17" valign="bottom">
       <font color="#666666">현재 진행중인 방송 정보입니다.</font>
     </td></tr>
   </table>
   ```
3. 이 `<table>…</table>` 부분을 지우고, 그 자리에 아래 한 줄을 넣습니다. (`<!-- 타이틀 -->` 줄은 남겨도 됩니다)
   ```php
   <?php @include $_SERVER['DOCUMENT_ROOT'] . '/wowcast/old_player_notice.php'; ?>
   ```
4. 배너를 끄고 싶으면 `old_player_notice.php` 안의 `$WOWCCM_SHOW_NEW_PLAYER_NOTICE`를 `false`로 바꾸면 됩니다. 원래 제목 줄로 돌아갑니다.
