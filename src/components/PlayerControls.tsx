import type { LiveStatus } from "../lib/usePlayer";
import { MuteIcon, PlayIcon, StopIcon, VolHighIcon, VolLowIcon } from "./Icons";

interface VolumeProps {
  volume: number;
  onVolume: (v: number) => void;
  muted: boolean;
  onMute: () => void;
  compact?: boolean;
}

export function PlayButton({ status, onToggle, size = 62 }: { status: LiveStatus; onToggle: () => void; size?: number }) {
  const playing = status !== "stopped";
  const busy = status === "connecting" || status === "reconnecting";
  return (
    <button
      className={`play ${busy ? "play--busy" : ""}`}
      style={{ width: size, height: size }}
      onClick={onToggle}
      aria-label={playing ? "정지" : "재생"}
      title={playing ? "정지" : "재생"}
    >
      {playing ? <StopIcon size={size * 0.36} /> : <PlayIcon size={size * 0.4} />}
    </button>
  );
}

export function Volume({ volume, onVolume, muted, onMute, compact }: VolumeProps) {
  const shown = muted ? 0 : volume;
  return (
    <div className={`volume ${compact ? "volume--compact" : ""}`}>
      <button className="volume__icon" onClick={onMute} title={muted ? "소리 켜기" : "음소거"}>
        {muted ? <MuteIcon size={17} /> : <VolLowIcon size={17} />}
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
      {!compact && (
        <span className="volume__icon volume__icon--end" aria-hidden>
          <VolHighIcon size={17} />
        </span>
      )}
    </div>
  );
}

export function PlayerControls(p: VolumeProps & { status: LiveStatus; onToggle: () => void; message: string }) {
  return (
    <section className="controls">
      <div className="controls__row">
        <PlayButton status={p.status} onToggle={p.onToggle} />
        <Volume {...p} />
      </div>
      <p className="controls__status">{p.message}</p>
    </section>
  );
}
