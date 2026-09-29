import { useEffect, useState } from "react";
import { STATION } from "./config";
import { useRadio } from "./lib/useRadio";
import { useNowPlaying } from "./lib/useNowPlaying";
import { useMediaSession } from "./lib/useMediaSession";
import { onTrayToggle, setMiniMode, splitTitle } from "./lib/tauri";
import { TitleBar } from "./components/TitleBar";
import { ProgramCard } from "./components/ProgramCard";
import { NowPlaying } from "./components/NowPlaying";
import { Controls } from "./components/Controls";
import { QuickLinks } from "./components/QuickLinks";
import { NoticeTicker } from "./components/NoticeTicker";
import { Tabs } from "./components/Tabs";
import { MiniPlayer } from "./components/MiniPlayer";

export default function App() {
  const radio = useRadio(STATION.streamUrl);
  const { current, history } = useNowPlaying(STATION.streamUrl, STATION.nowPlayingInterval);
  const track = splitTitle(current);
  const [mini, setMini] = useState(false);
  const [pinned, setPinned] = useState(true);

  useMediaSession(
    track?.title ?? STATION.slogan,
    track?.artist ?? "WOWCCM",
    radio.playing,
    radio.play,
    radio.stop,
  );

  // 트레이 메뉴 "재생 / 정지"
  useEffect(() => {
    const un = onTrayToggle(radio.toggle);
    return () => void un.then((f) => f());
  }, [radio.toggle]);

  // 스페이스바로 재생/정지 (입력창 밖에서만)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      radio.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [radio.toggle]);

  const goMini = (m: boolean) => {
    setMini(m);
    setMiniMode(m, pinned);
  };

  const volumeProps = {
    volume: radio.volume,
    onVolume: radio.setVolume,
    muted: radio.muted,
    onMute: radio.toggleMute,
  };

  if (mini) {
    return (
      <MiniPlayer
        title={track?.title ?? STATION.slogan}
        artist={track?.artist ?? ""}
        status={radio.status}
        onToggle={radio.toggle}
        {...volumeProps}
        pinned={pinned}
        onPin={() => {
          setPinned(!pinned);
          setMiniMode(true, !pinned);
        }}
        onExpand={() => goMini(false)}
      />
    );
  }

  return (
    <div className="app">
      <TitleBar onMini={() => goMini(true)} />
      <main className="main">
        <ProgramCard onAir={radio.status === "playing"} />
        <NowPlaying
          title={track?.title ?? null}
          artist={track?.artist ?? ""}
          playing={radio.status === "playing"}
        />
        <Controls status={radio.status} onToggle={radio.toggle} {...volumeProps} />
        <QuickLinks />
      </main>
      <NoticeTicker />
      <Tabs history={history} />
    </div>
  );
}
