import { API, STATION } from "../config";
import { fetchIcyTitle, wowGet, wowPostRequest } from "./tauri";

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

export interface ScheduleItem {
  time: string;
  title: string;
  sub: string;
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

export async function getRequests(): Promise<RequestPost[]> {
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
    const sub = clean(li.querySelector("#guest_name")?.textContent).replace(/^┗\s*/, "");
    li.querySelector("#guest_name")?.remove();
    const text = clean(li.textContent).replace(/방송중|ON AIR/gi, "").trim();
    const tm = /(\d{1,2}:\d{2})/.exec(text);
    const time = tm ? tm[1].padStart(5, "0") : "";
    const title = clean(time ? text.replace(tm![1], "") : text);
    return { time, title, sub };
  });

  return { recasts, schedule: markOnAir(rows, now) };
}

export async function getMiniPage() {
  return parseMiniPage(await wowGet(API.miniPage));
}
