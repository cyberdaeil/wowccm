import { useCallback, useEffect, useRef, useState } from "react";

/** 일정 간격으로 데이터를 다시 불러온다. 실패하면 이전 값을 그대로 둔다. */
export function usePolling<T>(load: () => Promise<T>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    try {
      setData(await loadRef.current());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, intervalMs);
    const onVisible = () => !document.hidden && void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, intervalMs]);

  return { data, error, refresh };
}
