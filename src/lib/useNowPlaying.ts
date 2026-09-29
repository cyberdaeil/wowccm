import { useEffect, useRef, useState } from "react";
import { fetchNowPlaying } from "./tauri";

export interface TrackEntry {
  raw: string;
  at: Date;
}

/** 주기적으로 곡 정보를 읽고, 바뀔 때마다 최근 곡 목록에 쌓는다. */
export function useNowPlaying(streamUrl: string, intervalMs: number) {
  const [current, setCurrent] = useState<string | null>(null);
  const [history, setHistory] = useState<TrackEntry[]>([]);
  const last = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const t = await fetchNowPlaying(streamUrl);
      if (!alive || !t) return;
      if (last.current === t) return;
      last.current = t;
      setCurrent(t);
      setHistory((h) => [{ raw: t, at: new Date() }, ...h].slice(0, 30));
    };
    void tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [streamUrl, intervalMs]);

  return { current, history };
}
