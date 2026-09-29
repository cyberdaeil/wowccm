import { API, STATION } from "../config";
import { fetchIcyTitle, wowGet, wowPostRequest, youtubeLive, type YoutubeLive } from "./tauri";

export interface ProgramInfo {
  program: string;
  presenter: string;
  onair: boolean;
}

export interface RequestPost {
  name: string;
  content: string;
  day: string;
  clock: string;
}

export interface RecastItem {
  program: string;
  date: string;
  audio: string;
}

export interface Notice {
  title: string;
  link: string;
  date: string; // MM-DD
}

export interface ScheduleItem {
  time: string;
  title: string;
  sub: string;
  /** 편성표에 📹(보이는 방송) 표시가 있는 프로그램 */
  visible: boolean;
  onair: boolean;
}

const parseHtml = (html: string) => new DOMParser().parseFromString(html, "text/html");
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export async function getProgram(): Promise<ProgramInfo> {
  const d = JSON.parse(await wowGet(API.program));
  return { program: clean(d.program), presenter: clean(d.presenter), onair: Number(d.onair) === 1 };
}

/** 현재 곡. 방송이 멈췄으면 null */
export async function getSong(): Promise<string | null> {
  try {
    const d = JSON.parse(await wowGet(API.song));
    return d.status === 1 && d.song ? clean(d.song) : null;
  } catch {
    return fetchIcyTitle(STATION.streamUrl);
  }
}

export async function getDjImage(): Promise<string | null> {
  const d = JSON.parse(await wowGet(API.dj));
  return d.image ? new URL(d.image, STATION.site).href : null;
}

/** 줄바꿈(<br>)은 살리고 나머지 태그는 글자만 꺼낸다. innerHTML로 넣지 않으므로 안전하다. */
function textWithBreaks(el: Element | null): string {
  if (!el) return "";
  el.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (el.textContent ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function parseRequests(html: string): RequestPost[] {
  return [...parseHtml(html).querySelectorAll(".request-item")].map((it) => ({
    name: clean(it.querySelector(".request-name")?.textContent),
    content: textWithBreaks(it.querySelector(".request-content")),
    day: clean(it.querySelector(".request-day")?.textContent),
    clock: clean(it.querySelector(".request-clock")?.textContent),
  }));
}

/** 앱 전용 목록(player_requests.php, JSON)을 해석한다. 형식이 맞지 않으면 null */
export function parsePlayerRequests(json: string): RequestPost[] | null {
  try {
    const d = JSON.parse(json);
    if (!d?.ok || !Array.isArray(d.items)) return null;
    return d.items.map((it: Record<string, unknown>) => ({
      name: clean(String(it.name ?? "")),
      content: String(it.content ?? "")
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n"),
      day: clean(String(it.day ?? "")),
      clock: clean(String(it.clock ?? "")),
    }));
  } catch {
    return null;
  }
}

/** 사연 목록: 앱 전용 파일(7개)을 먼저 쓰고, 없으면 미니 페이지 목록(4개)을 쓴다 */
export async function getRequests(): Promise<RequestPost[]> {
  try {
    const posts = parsePlayerRequests(await wowGet(API.playerRequests));
    if (posts) return posts;
  } catch {
    /* 파일이 아직 없음 → 기존 목록 */
  }
  return parseRequests(await wowGet(API.requests));
}

export async function postRequest(name: string, content: string): Promise<{ ok: boolean; message: string }> {
  try {
    const d = JSON.parse(await wowPostRequest(name, content));
    return { ok: !!d.ok, message: d.message ?? "" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "등록 결과를 확인하지 못했습니다." };
  }
}

/** 편성표는 한국 시각 기준이다. 해외 청취자 PC의 시간대와 상관없이 한국 시각(분)을 구한다. */
export function kstMinutes(now: Date): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .split(":")
    .map(Number);
  return h * 60 + m;
}

/** 편성 목록은 오늘부터 시간순이다. 시각이 줄어들면 다음 날로 넘어간 것으로 본다. */
export function markOnAir(items: Omit<ScheduleItem, "onair">[], now: Date): ScheduleItem[] {
  const nowMin = kstMinutes(now);
  let day = 0;
  let prev = -1;
  let active = -1;
  items.forEach((it, i) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(it.time);
    if (!m) return;
    const min = Number(m[1]) * 60 + Number(m[2]);
    if (min < prev) day += 1;
    prev = min;
    if (day === 0 && min <= nowMin) active = i;
  });
  return items.map((it, i) => ({ ...it, onair: i === active }));
}

export function parseMiniPage(html: string, now = new Date()) {
  const doc = parseHtml(html);
  const tpl = (id: string) =>
    (doc.getElementById(id) as HTMLTemplateElement | null)?.content ?? doc.createDocumentFragment();

  const recasts: RecastItem[] = [...tpl("recastTemplate").querySelectorAll(".recast-item")]
    .map((it) => ({
      program: clean(it.querySelector(".recast-program")?.textContent),
      date: clean(it.querySelector(".recast-date")?.textContent),
      audio: it.querySelector(".recast-play")?.getAttribute("data-audio") ?? "",
    }))
    .filter((r) => r.audio);

  const rows = [...tpl("scheduleTemplate").querySelectorAll(".title_item")].map((li) => {
    const visible = [...li.querySelectorAll("img")].some(
      (img) => /video\.png/.test(img.getAttribute("src") ?? "") || img.getAttribute("title") === "보이는 방송",
    );
    const sub = clean(li.querySelector("#guest_name")?.textContent).replace(/^┗\s*/, "");
    li.querySelector("#guest_name")?.remove();
    const text = clean(li.textContent).replace(/방송중|ON AIR/gi, "").trim();
    const tm = /(\d{1,2}:\d{2})/.exec(text);
    const time = tm ? tm[1].padStart(5, "0") : "";
    const title = clean(time ? text.replace(tm![1], "") : text);
    return { time, title, sub, visible };
  });

  return { recasts, schedule: markOnAir(rows, now) };
}

export async function getMiniPage() {
  return parseMiniPage(await wowGet(API.miniPage));
}

/** 공지사항 RSS. 링크의 &amp;가 두 번 이스케이프되어 오므로 한 번 더 풀어 준다. */
export function parseNotices(xml: string, limit = 5): Notice[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return [...doc.querySelectorAll("item")].slice(0, limit).map((it) => {
    const date = clean(it.getElementsByTagName("dc:date")[0]?.textContent);
    const m = /^\d{4}-(\d{2})-(\d{2})/.exec(date);
    return {
      title: clean(it.querySelector("title")?.textContent),
      link: clean(it.querySelector("link")?.textContent).replace(/&amp;/g, "&"),
      date: m ? `${m[1]}-${m[2]}` : "",
    };
  });
}

export async function getNotices(): Promise<Notice[]> {
  return parseNotices(await wowGet(API.notices));
}

/**
 * 보이는 방송(유튜브 라이브) 여부.
 * 1순위: wowccm.net 서버가 YouTube API로 확인한 결과 (API 키는 서버에만 있다)
 * 2순위: 앱이 유튜브 채널 페이지를 직접 확인
 * 둘 다 실패하면 오류를 던지고, 화면은 편성표의 보이는 방송 표시로 대신 판단한다.
 */
export async function getYoutubeLive(): Promise<YoutubeLive> {
  try {
    const d = JSON.parse(await wowGet(API.youtubeLive));
    if (typeof d.live === "boolean" && !d.error) {
      return {
        live: d.live,
        url: d.url ?? null,
        videoId: d.videoId ?? null,
        channelId: d.channelId ?? null,
        title: d.title ?? "",
      };
    }
  } catch {
    /* 서버 파일이 아직 없거나 오류 → 다음 방법 */
  }
  return youtubeLive();
}

/** https://www.youtube.com/watch?v=XXXXXXXXXXX → XXXXXXXXXXX */
export function videoIdFromUrl(url: string | null | undefined): string | null {
  const m = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url ?? "");
  return m ? m[1] : null;
}

/** wowccm.net에 영상 페이지(visible_embed.php)가 올라가 있는지 */
export async function hasEmbedPage(): Promise<boolean> {
  try {
    return (await wowGet(`${API.visibleEmbed}?check=1`)).trim() === "ok";
  } catch {
    return false;
  }
}

/**
 * 플레이어 안에 띄울 영상 주소.
 * wowccm.net 영상 페이지를 거치면 유튜브가 "wowccm.net에서 온 재생"으로 인식해 막히지 않는다.
 * 그 페이지가 없으면 유튜브 영상을 직접 불러온다.
 */
export function embedSrc(target: { videoId?: string | null; channelId?: string | null }, viaSite: boolean): string | null {
  const { videoId, channelId } = target;
  if (!videoId && !channelId) return null;
  if (viaSite) {
    const q = videoId ? `v=${encodeURIComponent(videoId)}` : `c=${encodeURIComponent(channelId!)}`;
    return `${STATION.site}${API.visibleEmbed}?${q}`;
  }
  const opts = "autoplay=1&playsinline=1&rel=0&modestbranding=1";
  return videoId
    ? `https://www.youtube.com/embed/${videoId}?${opts}`
    : `https://www.youtube.com/embed/live_stream?channel=${channelId}&${opts}`;
}
