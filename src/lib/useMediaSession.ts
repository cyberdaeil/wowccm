import { useEffect, useRef } from "react";
import { mediaUpdate, onMediaControl } from "./tauri";

/**
 * 키보드 미디어 키, OS 미디어 위젯(Windows 볼륨 팝업, macOS 제어 센터) 연동.
 * 제목에는 지금 나오는 곡, 그 아래에는 프로그램명을 보여 준다.
 */
export function useMediaSession(
  title: string,
  artist: string,
  artwork: string | null,
  playing: boolean,
  play: () => void,
  stop: () => void,
) {
  useEffect(() => {
    mediaUpdate({ title, artist, cover: artwork, playing });
  }, [title, artist, artwork, playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "WOWCCM 와플",
      artwork: artwork ? [{ src: artwork, sizes: "512x512" }] : [],
    });
  }, [title, artist, artwork]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.playbackState = playing ? "playing" : "paused";
    // 처리기에 넘어오는 이벤트 정보를 stop의 안내 문구로 넘기지 않도록 감싼다
    ms.setActionHandler("play", () => play());
    ms.setActionHandler("pause", () => stop());
    ms.setActionHandler("stop", () => stop());
  }, [playing, play, stop]);

  // Windows: 앱이 받은 미디어 키를 재생/정지로
  const latest = useRef({ playing, play, stop });
  latest.current = { playing, play, stop };
  useEffect(() => {
    const un = onMediaControl((action) => {
      const { playing: on, play: p, stop: s } = latest.current;
      if (action === "play" && !on) p();
      else if ((action === "pause" || action === "stop") && on) s();
      else if (action === "toggle") (on ? s : p)();
    });
    return () => void un.then((f) => f());
  }, []);
}
