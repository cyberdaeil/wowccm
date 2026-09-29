import { useCallback, useEffect, useRef, useState } from "react";

export type LiveStatus = "stopped" | "connecting" | "playing" | "reconnecting";

const VOLUME_KEY = "wowccm.volume";

function loadVolume(): number {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
}

/**
 * 생방송과 다시듣기 재생.
 * - 생방송은 일시정지가 아니라 접속을 끊는다. 다시 누르면 지금 방송부터 나온다.
 * - 생방송이 끊기면 1, 2, 4 … 최대 30초 간격으로 다시 접속한다.
 * - 둘 중 하나를 틀면 다른 하나는 멈춘다.
 */
export function usePlayer(streamUrl: string) {
  const live = useRef<HTMLAudioElement | null>(null);
  const recast = useRef<HTMLAudioElement | null>(null);
  const wantLive = useRef(false);
  const retry = useRef<{ timer?: number; delay: number }>({ delay: 1000 });

  const [status, setStatus] = useState<LiveStatus>("stopped");
  const [recastUrl, setRecastUrl] = useState<string | null>(null);
  const [recastPlaying, setRecastPlaying] = useState(false);
  const [message, setMessage] = useState("재생 버튼을 눌러 방송을 들어보세요.");
  const [volume, setVolumeState] = useState(loadVolume);
  const [muted, setMuted] = useState(false);

  const connect = useCallback(() => {
    const a = live.current;
    if (!a) return;
    a.src = `${streamUrl}?_live=${Date.now()}`;
    a.play().catch(() => {
      /* 오류는 error 이벤트에서 처리 */
    });
  }, [streamUrl]);

  const scheduleReconnect = useCallback(() => {
    if (!wantLive.current) return;
    window.clearTimeout(retry.current.timer);
    setStatus("reconnecting");
    setMessage("방송에 다시 연결하는 중…");
    const delay = retry.current.delay;
    retry.current.delay = Math.min(delay * 2, 30_000);
    retry.current.timer = window.setTimeout(connect, delay);
  }, [connect]);

  const disconnectLive = () => {
    const a = live.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
  };

  const clearRecast = () => {
    const r = recast.current;
    if (r) {
      r.pause();
      r.removeAttribute("src");
      r.load();
    }
    setRecastUrl(null);
    setRecastPlaying(false);
  };

  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    live.current = a;
    const r = new Audio();
    r.preload = "none";
    recast.current = r;

    const onPlaying = () => {
      retry.current.delay = 1000;
      setStatus("playing");
      setMessage("WOWCCM 방송을 재생하고 있습니다.");
    };
    const onWaiting = () => wantLive.current && setStatus("connecting");
    const onFail = () => scheduleReconnect();
    a.addEventListener("playing", onPlaying);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("error", onFail);
    a.addEventListener("ended", onFail);
    a.addEventListener("stalled", onFail);

    r.addEventListener("playing", () => {
      setRecastPlaying(true);
      setMessage("다시듣기를 재생하고 있습니다.");
    });
    r.addEventListener("pause", () => setRecastPlaying(false));
    r.addEventListener("ended", () => {
      setRecastUrl(null);
      setMessage("다시듣기 재생이 끝났습니다.");
    });
    r.addEventListener("error", () => {
      if (!r.getAttribute("src")) return;
      setRecastUrl(null);
      setRecastPlaying(false);
      setMessage("다시듣기 음원을 재생하지 못했습니다.");
    });

    return () => {
      window.clearTimeout(retry.current.timer);
      [a, r].forEach((x) => {
        x.pause();
        x.removeAttribute("src");
        x.load();
      });
    };
  }, [scheduleReconnect]);

  useEffect(() => {
    [live.current, recast.current].forEach((x) => {
      if (x) {
        x.volume = volume;
        x.muted = muted;
      }
    });
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [volume, muted]);

  const play = useCallback(() => {
    clearRecast();
    wantLive.current = true;
    retry.current.delay = 1000;
    setStatus("connecting");
    setMessage("방송 연결 중…");
    connect();
  }, [connect]);

  const stop = useCallback((msg = "방송이 정지되었습니다.") => {
    wantLive.current = false;
    window.clearTimeout(retry.current.timer);
    disconnectLive();
    setStatus("stopped");
    setMessage(msg);
  }, []);

  /** 보이는 방송을 볼 때 라디오·다시듣기 소리를 멈춘다. 생방송을 듣던 중이었는지 돌려준다. */
  const pauseForVideo = useCallback(() => {
    const wasLive = wantLive.current;
    if (wasLive) stop("보이는 방송을 보는 동안 라디오 소리를 잠시 멈췄습니다.");
    const r = recast.current;
    if (r && !r.paused) r.pause();
    return wasLive;
  }, [stop]);

  const toggle = useCallback(() => {
    if (wantLive.current) stop();
    else play();
  }, [play, stop]);

  /** 다시듣기: 같은 회차를 다시 누르면 일시정지/이어듣기 */
  const toggleRecast = useCallback(
    (url: string) => {
      const r = recast.current;
      if (!r) return;
      if (recastUrl === url && r.getAttribute("src")) {
        if (r.paused) void r.play();
        else {
          r.pause();
          setMessage("다시듣기가 일시정지되었습니다.");
        }
        return;
      }
      if (wantLive.current) stop();
      r.src = url;
      setRecastUrl(url);
      setMessage("다시듣기 불러오는 중…");
      r.play().catch(() => {
        /* error 이벤트에서 처리 */
      });
    },
    [recastUrl, stop],
  );

  return {
    status,
    playing: status !== "stopped",
    toggle,
    play,
    stop,
    pauseForVideo,
    recastUrl,
    recastPlaying,
    toggleRecast,
    message,
    volume,
    setVolume: (v: number) => {
      setVolumeState(v);
      if (v > 0) setMuted(false);
    },
    muted,
    toggleMute: () => setMuted((m) => !m),
  };
}
