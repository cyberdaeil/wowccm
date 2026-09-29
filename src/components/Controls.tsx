import type { RadioStatus } from "../lib/useRadio";
import { PlayIcon, StopIcon, VolumeIcon } from "./Icons";

interface Props {
  status: RadioStatus;
  onToggle: () => void;
  volume: number;
  onVolume: (v: number) => void;
  muted: boolean;
  onMute: () => void;
  compact?: boolean;
}

const STATUS_TEXT: Record<RadioStatus, string> = {
  stopped: "",
  connecting: "연결 중…",
  playing: "",
  reconnecting: "다시 연결하는 중…",
};

export function PlayButton({
  status,
  onToggle,
  size = 64,
}: {
  status: RadioStatus;
  onToggle: () => void;
  size?: number;
}) {
  const playing = status !== "stopped";
  const busy = status === "connecting" || status === "reconnecting";
  return (
    <button
      className={`play-btn ${busy ? "play-btn--busy" : ""}`}
      style={{ width: size, height: size }}
      onClick={onToggle}
      title={playing ? "정지" : "재생"}
      aria-label={playing ? "정지" : "재생"}
    >
      {playing ? <StopIcon size={size * 0.38} /> : <PlayIcon size={size * 0.42} />}
    </button>
  );
}

export function VolumeControl({
  volume,
  onVolume,
  muted,
  onMute,
}: Pick<Props, "volume" | "onVolume" | "muted" | "onMute">) {
  const shown = muted ? 0 : volume;
  return (
    <div className="volume">
      <button className="icon-btn" onClick={onMute} title={muted ? "소리 켜기" : "음소거"}>
        <VolumeIcon size={18} off={muted || volume === 0} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={shown}
        onChange={(e) => onVolume(Number(e.target.value))}
        style={{ ["--fill" as string]: `${shown * 100}%` }}
        aria-label="볼륨"
      />
    </div>
  );
}

export function Controls(p: Props) {
  return (
    <section className="controls">
      <VolumeControl {...p} />
      <PlayButton status={p.status} onToggle={p.onToggle} />
      <span className="status-text">{STATUS_TEXT[p.status]}</span>
    </section>
  );
}
