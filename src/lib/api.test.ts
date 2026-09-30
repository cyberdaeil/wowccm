// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  embedSrc,
  interleave,
  kstMinutes,
  markOnAir,
  parseMiniPage,
  parseActiveEvents,
  parseNotices,
  parsePlayerRequests,
  parseRequests,
  videoIdFromUrl,
} from "./api";

// 한국 시각 2026-09-29 14:30 = UTC 05:30
const KST_1430 = new Date("2026-09-29T05:30:00Z");

describe("kstMinutes", () => {
  it("PC 시간대와 상관없이 한국 시각을 쓴다", () => {
    expect(kstMinutes(KST_1430)).toBe(14 * 60 + 30);
  });
});

describe("markOnAir", () => {
  const rows = [
    { time: "00:00", title: "자동방송", sub: "", visible: false },
    { time: "14:00", title: "리민의 음악노트", sub: "with 옹기장이", visible: true },
    { time: "16:00", title: "자동방송", sub: "", visible: false },
    { time: "00:00", title: "김대일의 해피타임", sub: "", visible: false }, // 다음 날
    { time: "01:00", title: "자동방송", sub: "", visible: false },
  ];

  it("지금 진행 중인 방송 하나만 ON AIR", () => {
    const r = markOnAir(rows, KST_1430);
    expect(r.filter((x) => x.onair).map((x) => x.title)).toEqual(["리민의 음악노트"]);
  });

  it("다음 날 새벽 편성은 오늘 방송으로 착각하지 않는다", () => {
    const r = markOnAir(rows, new Date("2026-09-29T08:00:00Z")); // 한국 17:00
    expect(r.findIndex((x) => x.onair)).toBe(2);
  });
});

describe("parseRequests", () => {
  it("이름·내용·날짜를 꺼내고 줄바꿈은 살린다", () => {
    const html =
      '<div class="request-item"><div class="request-name">진심</div>' +
      '<div class="request-content">첫 줄<br />\n둘째 줄 <b>굵게</b></div>' +
      '<div class="request-date"><span class="request-day">09-17</span><span class="request-clock">18:57</span></div></div>';
    expect(parseRequests(html)).toEqual([
      { name: "진심", content: "첫 줄\n둘째 줄 굵게", day: "09-17", clock: "18:57" },
    ]);
  });

  it("글 안의 태그는 실행되지 않고 글자로만 남는다", () => {
    const html =
      '<div class="request-item"><div class="request-name">x</div>' +
      '<div class="request-content"><img src=x onerror="alert(1)">안녕</div></div>';
    expect(parseRequests(html)[0].content).toBe("안녕");
  });
});

describe("parseMiniPage", () => {
  const page = `
    <template id="recastTemplate"><div class="recast-list">
      <div class="recast-item"><div class="recast-meta">
        <div class="recast-program">황성대의 캠프파이어</div><div class="recast-date">9월 28일 방송</div>
      </div><button class="recast-play" data-audio="http://wowccm.synology.me/podcast/camp.mp3"></button></div>
    </div></template>
    <template id="scheduleTemplate"><dl class="title_list">
      <li class="title_item"><img src="i.gif">&nbsp;&nbsp;00:00&nbsp;&nbsp;<a>자동방송</a></li>
      <li class="title_item"><img src="i.gif">&nbsp;&nbsp;14:00&nbsp;&nbsp;<a>리민의 음악노트</a>
        <img src="/img/video.png" title="보이는 방송"><img title="방송중" alt="ON AIR"><div id=guest_name>┗ with 옹기장이</div></li>
    </dl></template>`;

  it("다시듣기와 편성표를 읽는다", () => {
    const r = parseMiniPage(page, KST_1430);
    expect(r.recasts).toEqual([
      { program: "황성대의 캠프파이어", date: "9월 28일 방송", audio: "http://wowccm.synology.me/podcast/camp.mp3" },
    ]);
    expect(r.schedule).toEqual([
      { time: "00:00", title: "자동방송", sub: "", visible: false, onair: false },
      { time: "14:00", title: "리민의 음악노트", sub: "with 옹기장이", visible: true, onair: true },
    ]);
  });
});

describe("parseNotices", () => {
  it("공지 제목·링크·날짜를 읽고 이중 이스케이프된 링크를 푼다", () => {
    const xml = `<?xml version="1.0" encoding="utf-8" ?>
      <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
      <item><title>와우씨씨엠 서버이전 안내</title>
      <link>https://wowccm.net/bbs/board.php?bo_table=news&amp;amp;wr_id=3227</link>
      <dc:date>2026-09-23T01:35:32+09:00</dc:date></item>
      </channel></rss>`;
    expect(parseNotices(xml)).toEqual([
      {
        title: "와우씨씨엠 서버이전 안내",
        link: "https://wowccm.net/bbs/board.php?bo_table=news&wr_id=3227",
        date: "09-23",
        at: "2026-09-23T01:35:32+09:00",
      },
    ]);
  });
});

describe("보이는 방송 영상 주소", () => {
  it("유튜브 주소에서 영상 ID를 꺼낸다", () => {
    expect(videoIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(videoIdFromUrl("https://www.youtube.com/channel/UCxyz")).toBeNull();
    expect(videoIdFromUrl(null)).toBeNull();
  });

  it("wowccm.net 영상 페이지를 거치거나, 없으면 유튜브를 직접 부른다", () => {
    expect(embedSrc({ videoId: "abc" }, true)).toBe("https://wowccm.net/wowcast/visible_embed.php?v=abc");
    expect(embedSrc({ channelId: "UCx" }, true)).toBe("https://wowccm.net/wowcast/visible_embed.php?c=UCx");
    expect(embedSrc({ videoId: "abc" }, false)).toMatch(/^https:\/\/www\.youtube\.com\/embed\/abc\?autoplay=1/);
    expect(embedSrc({ channelId: "UCx" }, false)).toMatch(/embed\/live_stream\?channel=UCx&/);
    expect(embedSrc({}, true)).toBeNull();
  });
});

describe("parsePlayerRequests (앱 전용 사연 목록)", () => {
  it("JSON 목록을 읽는다", () => {
    const json = JSON.stringify({
      ok: true,
      items: [{ name: "원혜영", content: "첫 줄\n  둘째   줄", day: "09-29", clock: "15:59" }],
    });
    expect(parsePlayerRequests(json)).toEqual([
      { name: "원혜영", content: "첫 줄\n둘째 줄", day: "09-29", clock: "15:59" },
    ]);
  });

  it("설정 전이거나 형식이 다르면 null (기존 목록으로 대체)", () => {
    expect(parsePlayerRequests('{"ok":false,"error":"board_not_configured"}')).toBeNull();
    expect(parsePlayerRequests("<html>404</html>")).toBeNull();
  });
});

describe("이벤트", () => {
  const rss = (items: [string, string][]) => `<?xml version="1.0" encoding="utf-8" ?>
    <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
    ${items.map(([t, d], i) => `<item><title>${t}</title><link>https://wowccm.net/bbs/board.php?bo_table=dica_h&amp;amp;wr_id=${i}</link><dc:date>${d}</dc:date></item>`).join("")}
    </channel></rss>`;
  const now = new Date("2026-09-30T12:00:00+09:00");

  it("끝난 이벤트와 60일이 지난 글은 빼고 진행 중인 것만 고른다", () => {
    const xml = rss([
      ["찬양 앨범 증정 이벤트", "2026-09-20T10:00:00+09:00"],
      ["[종료] 영화 예매권 이벤트", "2026-09-10T10:00:00+09:00"],
      ["[당첨자발표] 영화 예매권", "2026-09-15T10:00:00+09:00"],
      ["[당첨자 발표] 도서 증정", "2026-09-16T10:00:00+09:00"],
      ["[마감] 콘서트 초대", "2026-09-17T10:00:00+09:00"],
      ["표시를 깜빡한 옛 이벤트", "2022-04-04T10:00:00+09:00"],
    ]);
    expect(parseActiveEvents(xml, now).map((e) => e.title)).toEqual(["찬양 앨범 증정 이벤트"]);
    expect(parseActiveEvents(xml, now)[0].kind).toBe("event");
  });

  it("진행 중 이벤트가 없으면 빈 목록", () => {
    expect(parseActiveEvents(rss([["[종료] 지난 이벤트", "2026-09-20T10:00:00+09:00"]]), now)).toEqual([]);
  });

  it("공지와 이벤트를 번갈아 늘어놓는다", () => {
    const n = (t: string) => ({ title: t, link: "", date: "" });
    const e = (t: string) => ({ title: t, link: "", date: "", kind: "event" as const });
    expect(interleave([n("공지1"), n("공지2"), n("공지3")], [e("이벤트1")]).map((x) => x.title)).toEqual([
      "공지1",
      "이벤트1",
      "공지2",
      "공지3",
    ]);
    expect(interleave([n("공지1")], []).map((x) => x.kind)).toEqual(["notice"]);
  });
});
