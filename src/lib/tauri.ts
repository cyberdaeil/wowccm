import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 브라우저(npm run dev)에서 열어도 화면 작업을 할 수 있도록 Tauri가 없으면 조용히 넘어간다.
export const isTauri = "__TAURI_INTERNALS__" in window;

export async function fetchNowPlaying(url: string): Promise<string | null> {
  // 브라우저 미리보기에서 ?demo 를 붙이면 예시 곡을 보여준다
  if (!isTauri) return location.search.includes("demo") ? "Companion - WELOVE" : null;
  try {
    return await invoke<string | null>("now_playing", { url });
  } catch {
    return null;
  }
}

export function setMiniMode(mini: boolean, alwaysOnTop: boolean) {
  if (isTauri) void invoke("set_mini_mode", { mini, alwaysOnTop });
}

export function hideToTray() {
  if (isTauri) void invoke("hide_to_tray");
}

export function minimize() {
  if (isTauri) void getCurrentWindow().minimize();
}

export function onTrayToggle(cb: () => void): Promise<UnlistenFn> {
  if (!isTauri) return Promise.resolve(() => {});
  return listen("tray-toggle", cb);
}

/** "제목 - 아티스트" 또는 "아티스트 - 제목" 형태를 나눈다. 송출 프로그램 형식을 확인한 뒤 순서를 맞출 것. */
export function splitTitle(raw: string | null): { title: string; artist: string } | null {
  if (!raw) return null;
  const i = raw.indexOf(" - ");
  if (i < 0) return { title: raw, artist: "" };
  return { title: raw.slice(0, i).trim(), artist: raw.slice(i + 3).trim() };
}

/** 외부 링크는 기본 브라우저로 연다. */
export function openUrl(url: string) {
  if (!isTauri) {
    window.open(url, "_blank", "noopener");
    return;
  }
  void import("@tauri-apps/plugin-opener").then((m) => m.openUrl(url));
}
