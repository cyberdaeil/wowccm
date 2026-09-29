import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 브라우저(npm run dev)에서 열어도 화면 작업을 할 수 있도록 Tauri가 없으면 대신 동작한다.
export const isTauri = "__TAURI_INTERNALS__" in window;

/** wowccm.net 경로(/로 시작)를 GET. 앱에서는 Rust가, 브라우저 개발 모드에서는 Vite 프록시가 대신 요청한다. */
export async function wowGet(path: string): Promise<string> {
  if (isTauri) return invoke<string>("wow_get", { path });
  const res = await fetch(`/wowproxy${path}`);
  if (!res.ok) throw new Error(String(res.status));
  return res.text();
}

export async function wowPostRequest(path: string, name: string, content: string): Promise<string> {
  if (isTauri) return invoke<string>("wow_post_request", { path, name, content });
  throw new Error("브라우저 미리보기에서는 등록할 수 없습니다.");
}

/** 곡 정보 서버가 응답하지 않을 때 스트림 자체의 곡 정보(ICY)로 대신한다. */
export async function fetchIcyTitle(url: string): Promise<string | null> {
  if (!isTauri) return null;
  try {
    return await invoke<string | null>("now_playing", { url });
  } catch {
    return null;
  }
}

export type WindowMode = "wide" | "player" | "mini";

/** wide: 플레이어 + 오른쪽 창, player: 플레이어만, mini: 가로 바 */
export function setWindowMode(mode: WindowMode, alwaysOnTop = false) {
  if (isTauri) void invoke("set_window_mode", { mode, alwaysOnTop });
}

export function hideToTray() {
  if (isTauri) void invoke("hide_to_tray");
}

/** 플레이어 완전히 끄기 */
export function quitApp() {
  if (isTauri) void invoke("quit_app");
}

/** 창 닫기 요청(⌘W, Alt+F4, 창 테두리의 닫기)을 화면 쪽에서 처리한다 */
export function onCloseRequested(cb: () => void): Promise<UnlistenFn> {
  if (!isTauri) return Promise.resolve(() => {});
  return listen("close-requested", cb);
}

export const isMac = /Mac/i.test(navigator.userAgent);

export function minimize() {
  if (isTauri) void getCurrentWindow().minimize();
}

export function onTrayToggle(cb: () => void): Promise<UnlistenFn> {
  if (!isTauri) return Promise.resolve(() => {});
  return listen("tray-toggle", cb);
}

/** 외부 링크는 기본 브라우저로 연다. */
export function openUrl(url: string) {
  if (!isTauri) {
    window.open(url, "_blank", "noopener");
    return;
  }
  void import("@tauri-apps/plugin-opener").then((m) => m.openUrl(url));
}

export interface YoutubeLive {
  live: boolean;
  url: string | null;
  videoId?: string | null;
  channelId?: string | null;
  title?: string;
}

/** 유튜브 채널이 지금 라이브 중인지. 브라우저 미리보기에서는 ?ytlive / ?ytoff 로 상태를 흉내 낸다. */
export async function youtubeLive(): Promise<YoutubeLive> {
  if (!isTauri) {
    if (location.search.includes("ytlive")) return { live: true, url: "https://www.youtube.com/watch?v=AAAAAAAAAAA" };
    if (location.search.includes("ytoff")) return { live: false, url: null };
    throw new Error("브라우저에서는 유튜브 상태를 확인할 수 없습니다.");
  }
  return invoke<YoutubeLive>("youtube_live");
}
