import { useEffect } from "react";

/** 키보드 미디어 키, OS 미디어 위젯(Windows 볼륨 팝업, macOS 제어 센터) 연동 */
export function useMediaSession(
  title: string,
  artist: string,
  artwork: string | null,
  playing: boolean,
  play: () => void,
  stop: () => void,
) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "WOWCCM",
      artwork: artwork ? [{ src: artwork, sizes: "512x512" }] : [],
    });
  }, [title, artist, artwork]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.playbackState = playing ? "playing" : "paused";
    ms.setActionHandler("play", play);
    ms.setActionHandler("pause", stop);
    ms.setActionHandler("stop", stop);
  }, [playing, play, stop]);
}
