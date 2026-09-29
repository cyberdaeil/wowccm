# 서버 파일 (wowccm.net)

## youtube_live.php: 보이는 방송(유튜브 라이브) 확인

플레이어의 "보이는 방송" 버튼은 이 파일의 결과를 보고 켜집니다(주황색). 평소에는 회색입니다.

- 이 파일을 쓰는 이유는 **API 키를 앱에 넣지 않기 위해서**입니다. 앱에 넣으면 누구나 키를 꺼내 쓸 수 있습니다.
- 서버가 1분에 한 번만 유튜브에 묻습니다. 청취자가 몇 명이든 하루 사용량은 약 2,880 유닛이고, 무료 한도는 10,000 유닛입니다.
- 이 파일이 없거나 오류가 나면, 앱은 유튜브 페이지를 직접 확인하거나 편성표로 대신 판단합니다.

### 1. API 키 발급 (Google, 무료)

1. https://console.cloud.google.com 에 접속해 새 프로젝트를 만듭니다. 이름 예: `wowccm-player`
2. **API 및 서비스 → 라이브러리**에서 **YouTube Data API v3**를 찾아 **사용**을 누릅니다.
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키**를 누릅니다.
4. 만든 키의 **수정** 화면에서 제한을 겁니다.
   - **API 제한사항:** "키 제한" → YouTube Data API v3만 선택
   - **애플리케이션 제한사항:** "IP 주소" → wowccm.net 서버의 IP (권장)

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
