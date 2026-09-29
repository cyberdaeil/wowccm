import { useCallback, useEffect, useRef, useState } from "react";
import { isTauri } from "./tauri";

type Update = import("@tauri-apps/plugin-updater").Update;

export type UpdateState =
  | { kind: "none" }
  | { kind: "available"; version: string }
  | { kind: "downloading"; percent: number | null }
  | { kind: "error"; message: string };

const FIRST_CHECK_DELAY = 5_000; // 켜자마자 방송 연결이 먼저 되도록 조금 기다린다
const CHECK_INTERVAL = 6 * 60 * 60_000; // 켜 둔 채로 지내는 분들을 위해 6시간마다

/**
 * 자동 업데이트.
 * GitHub Releases의 latest.json에 더 높은 버전이 있으면 알려 주고,
 * "지금 업데이트"를 누르면 받아서 설치한 뒤 다시 실행한다. (업데이트 파일은 서명을 확인한다)
 */
export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ kind: "none" });
  const [dismissed, setDismissed] = useState(false);
  const update = useRef<Update | null>(null);

  const checkNow = useCallback(async () => {
    if (!isTauri) return;
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const u = await check();
      if (u) {
        update.current = u;
        setState((s) => (s.kind === "downloading" ? s : { kind: "available", version: u.version }));
      }
    } catch {
      /* 인터넷이 끊겼거나 서버 문제: 다음 확인 때 다시 시도 */
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(checkNow, FIRST_CHECK_DELAY);
    const id = window.setInterval(checkNow, CHECK_INTERVAL);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [checkNow]);

  const install = useCallback(async () => {
    const u = update.current;
    if (!u) return;
    let total = 0;
    let got = 0;
    setState({ kind: "downloading", percent: null });
    try {
      await u.downloadAndInstall((e) => {
        if (e.event === "Started") total = e.data.contentLength ?? 0;
        if (e.event === "Progress") {
          got += e.data.chunkLength;
          setState({ kind: "downloading", percent: total ? Math.min(100, Math.round((got / total) * 100)) : null });
        }
      });
      // Windows는 설치 프로그램이 앱을 닫고 새 버전을 띄운다. Mac은 여기서 다시 실행한다.
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  return {
    state: dismissed && state.kind === "available" ? ({ kind: "none" } as UpdateState) : state,
    install,
    dismiss: () => setDismissed(true),
  };
}
