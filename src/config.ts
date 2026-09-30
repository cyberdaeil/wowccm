// 방송국 설정. 서버 주소가 바뀌면 여기만 고치면 된다.
export const STATION = {
  name: "WOWCCM",
  streamUrl: "https://live.wowccm.net/live.mp3",
  /** 플레이어를 켜면 바로 방송을 재생한다 */
  autoplay: true,
  site: "https://wowccm.net",
};

// wowccm.net 데이터 주소
// 프로그램명·사연 등록·다시듣기·편성표는 미니 페이지와 같은 코드를 쓴다.
// 시험용 페이지(wow_mini_test_v2.php)가 바뀌어도 플레이어가 멈추지 않도록, 서버에 복사해 둔
// 플레이어 전용 파일(wapl_api.php)을 먼저 쓰고, 그 파일이 없을 때만 시험용 페이지를 쓴다.
export const MINI_PAGES = ["/wowcast/wapl_api.php", "/wowcast/wow_mini_test_v2.php"];
export const API = {
  program: "?mini_program_status=1", // MINI_PAGES 뒤에 붙인다. {"program","presenter","onair"}
  song: "/daeil/music5.php?song_check=1", // {"status","song"}
  dj: "/wowcast/dj5.php?check=1", // {"icq","image"}
  playerRequests: "/wowcast/player_requests.php?limit=7", // 앱 전용 사연 목록 7개 (server/player_requests.php)
  requests: "?mini_request_list=1", // MINI_PAGES 뒤에 붙인다. 사연 목록 HTML 조각 (4개, 위 파일이 없을 때 대신 사용)
  miniPage: "", // MINI_PAGES 자체. 다시듣기·편성표가 이 페이지 안에 들어 있다
  notices: "/bbs/rss.php?bo_table=news", // 공지사항 게시판 RSS
  events: "/bbs/rss.php?bo_table=dica_h", // 이벤트 게시판 RSS (비밀글은 RSS에 나오지 않는다)
  youtubeLive: "/wowcast/youtube_live.php", // 보이는 방송 여부 (server/youtube_live.php, YouTube API)
  visibleEmbed: "/wowcast/visible_embed.php", // 플레이어 안 영상 재생 페이지 (server/visible_embed.php)
};

export const LINKS = {
  visibleRadio: "https://www.youtube.com/@wowccm/live", // 보이는 방송 (유튜브 라이브)
  support: "https://wowccm.net/mission/sub_2.php", // 선교후원 (이전 플레이어와 같은 페이지)
  lyrics: "http://wowccm.iptime.org:8080/GetSongText.htm",
  recastAll: "https://wowccm.net/bbs/board.php?bo_table=recast",
  scheduleAll: "https://wowccm.net/bbs/board.php?bo_table=schedule_list&mode=l",
};

// 갱신 주기 (ms)
export const REFRESH = {
  song: 10_000,
  program: 30_000,
  requests: 10_000,
  miniPage: 10 * 60_000,
  notices: 30 * 60_000,
  youtube: 2 * 60_000, // 보이는 방송(유튜브 라이브) 확인
};
