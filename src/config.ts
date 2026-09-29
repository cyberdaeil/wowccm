// 방송국 정보. 링크와 데이터 주소가 정해지면 여기만 고치면 된다.
export const STATION = {
  name: "WOWCCM",
  slogan: "24시간 찬양방송 와우씨씨엠",
  streamUrl: "https://live.wowccm.net/live.mp3",
  // 곡 정보 갱신 주기(ms)
  nowPlayingInterval: 15_000,
};

// 빈 문자열이면 버튼이 "준비 중"으로 표시된다.
export const LINKS = {
  visibleRadio: "", // 보이는 방송
  chat: "", // 대화방
  support: "", // 선교후원
};

export const NOTICES: { text: string; url?: string }[] = [
  { text: "와우씨씨엠 새 플레이어 2.0 시험판입니다." },
  { text: "와우씨씨엠 각종 영상을 유튜브에서 가장 먼저 만나세요." },
];
