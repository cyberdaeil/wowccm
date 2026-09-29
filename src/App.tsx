import { useEffect, useState } from "react";
import { REFRESH, STATION } from "./config";
import { getDjImage, getMiniPage, getNotices, getProgram, getRequests, getSong, getYoutubeLive } from "./lib/api";
import { usePlayer } from "./lib/usePlayer";
import { usePolling } from "./lib/usePolling";
import { useMediaSession } from "./lib/useMediaSession";
import { onTrayToggle, setMiniMode } from "./lib/tauri";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { PlayerControls } from "./components/PlayerControls";
import { StationExtras } from "./components/StationExtras";
import { RequestPanel } from "./components/RequestPanel";
import { RecastPanel } from "./components/RecastPanel";
import { SchedulePanel } from "./components/SchedulePanel";
import { MiniPlayer } from "./components/MiniPlayer";

type Tab = "request" | "recast" | "schedule";
const TABS: { key: Tab; label: string }[] = [
  { key: "request", label: "사연&신청곡" },
  { key: "recast", label: "다시듣기" },
  { key: "schedule", label: "방송시간표" },
];

export default function App() {
  const player = usePlayer(STATION.streamUrl);
  const program = usePolling(getProgram, REFRESH.program);
  const dj = usePolling(getDjImage, REFRESH.program);
  const song = usePolling(getSong, REFRESH.song);
  const requests = usePolling(getRequests, REFRESH.requests);
  const page = usePolling(getMiniPage, REFRESH.miniPage);
  const notices = usePolling(getNotices, REFRESH.notices);
  const youtube = usePolling(getYoutubeLive, REFRESH.youtube);

  const [tab, setTab] = useState<Tab>("request");
  const [mini, setMini] = useState(false);
  const [pinned, setPinned] = useState(true);

  const programName = program.data?.program ?? "";
  const onAir = program.data?.onair ?? false;
  const songText = song.data ?? "";

  // 보이는 방송: 유튜브에서 직접 확인한다. 확인이 안 되면 편성표의 📹 표시로 대신 판단한다.
  const scheduleVisible = page.data?.schedule.some((s) => s.onair && s.visible) ?? false;
  const visibleLive = youtube.error || !youtube.data ? scheduleVisible : youtube.data.live;
  const visibleUrl = !youtube.error && youtube.data?.live ? youtube.data.url : null;

  useMediaSession(
    programName || "WOWCCM LIVE",
    songText || "WOWCCM",
    dj.data ?? null,
    player.playing,
    player.play,
    player.stop,
  );

  // 트레이 메뉴 "재생 / 정지"
  useEffect(() => {
    const un = onTrayToggle(player.toggle);
    return () => void un.then((f) => f());
  }, [player.toggle]);

  // 스페이스바로 재생/정지 (입력창 밖에서만)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      player.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player.toggle]);

  const goMini = (m: boolean) => {
    setMini(m);
    setMiniMode(m, pinned);
  };

  const vol = {
    volume: player.volume,
    onVolume: player.setVolume,
    muted: player.muted,
    onMute: player.toggleMute,
  };

  if (mini) {
    return (
      <MiniPlayer
        image={dj.data ?? null}
        program={programName || "WOWCCM"}
        song={songText || "24시간 찬양방송"}
        status={player.status}
        onToggle={player.toggle}
        {...vol}
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
      <Header onAir={onAir} onMini={() => goMini(true)} />
      <div className="scroll">
        <Hero image={dj.data ?? null} onAir={onAir} program={programName} song={song.data ?? null} />
        <PlayerControls status={player.status} onToggle={player.toggle} message={player.message} {...vol} />
        <StationExtras notices={notices.data} visibleLive={visibleLive} visibleUrl={visibleUrl} />

        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "request" && (
          <RequestPanel posts={requests.data} error={requests.error} onPosted={requests.refresh} />
        )}
        {tab === "recast" && (
          <RecastPanel
            items={page.data?.recasts ?? (page.error ? [] : null)}
            currentUrl={player.recastUrl}
            playing={player.recastPlaying}
            onToggle={player.toggleRecast}
          />
        )}
        {tab === "schedule" && <SchedulePanel items={page.data?.schedule ?? (page.error ? [] : null)} />}
      </div>
    </div>
  );
}
