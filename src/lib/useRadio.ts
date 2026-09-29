import { useCallback, useEffect, useRef, useState } from "react";

export type RadioStatus = "stopped" | "connecting" | "playing" | "reconnecting";

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
 * 실시간 스트림 재생.
 * - 정지 후 다시 재생하면 버퍼에 남은 옛 소리가 아니라 지금 방송부터 나오도록 새로 접속한다.
 * - 끊기면 1, 2, 4 … 최대 30초 간격으로 다시 접속한다.
 */
export function useRadio(streamUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantPlay = useRef(false);
  const retry = useRef<{ timer?: number; delay: number }>({ delay: 1000 });
  const [status, setStatus] = useState<RadioStatus>("stopped");
  const [volume, setVolumeState] = useState(loadVolume);
  const [muted, setMuted] = useState(false);

  const connect = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = `${streamUrl}?t=${Date.now()}`;
    a.play().catch(() => {
      /* 오류는 error 이벤트에서 처리 */
    });
  }, [streamUrl]);

  const scheduleReconnect = useCallback(() => {
    if (!wantPlay.current) return;
    window.clearTimeout(retry.current.timer);
    setStatus("reconnecting");
    const delay = retry.current.delay;
    retry.current.delay = Math.min(delay * 2, 30_000);
    retry.current.timer = window.setTimeout(connect, delay);
  }, [connect]);

  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    audioRef.current = a;

    const onPlaying = () => {
      retry.current.delay = 1000;
      setStatus("playing");
    };
    const onWaiting = () => wantPlay.current && setStatus("connecting");
    const onFail = () => scheduleReconnect();

    a.addEventListener("playing", onPlaying);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("error", onFail);
    a.addEventListener("ended", onFail);
    a.addEventListener("stalled", onFail);
    return () => {
      window.clearTimeout(retry.current.timer);
      a.pause();
      a.removeAttribute("src");
      a.load();
    };
  }, [scheduleReconnect]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [volume, muted]);

  const play = useCallback(() => {
    wantPlay.current = true;
    retry.current.delay = 1000;
    setStatus("connecting");
    connect();
  }, [connect]);

  const stop = useCallback(() => {
    wantPlay.current = false;
    window.clearTimeout(retry.current.timer);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load(); // 접속을 끊어 데이터 사용을 멈춘다
    }
    setStatus("stopped");
  }, []);

  const toggle = useCallback(() => {
    if (wantPlay.current) stop();
    else play();
  }, [play, stop]);

  return {
    status,
    playing: status !== "stopped",
    toggle,
    play,
    stop,
    volume,
    setVolume: (v: number) => {
      setVolumeState(v);
      if (v > 0) setMuted(false);
    },
    muted,
    toggleMute: () => setMuted((m) => !m),
  };
}
