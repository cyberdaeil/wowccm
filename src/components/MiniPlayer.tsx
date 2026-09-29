import type { RadioStatus } from "../lib/useRadio";
import { PlayButton, VolumeControl } from "./Controls";
import { ExpandIcon, PinIcon } from "./Icons";

interface Props {
  title: string;
  artist: string;
  status: RadioStatus;
  onToggle: () => void;
  volume: number;
  onVolume: (v: number) => void;
  muted: boolean;
  onMute: () => void;
  pinned: boolean;
  onPin: () => void;
  onExpand: () => void;
}

/** 작업하면서 틀어두는 가로 바 모드 */
export function MiniPlayer(p: Props) {
  return (
    <div className="mini" data-tauri-drag-region>
      <img src="/logo.svg" alt="" className="mini__logo" data-tauri-drag-region />
      <div className="mini__meta" data-tauri-drag-region>
        <b data-tauri-drag-region>{p.title}</b>
        <small data-tauri-drag-region>{p.artist || "WOWCCM 24시간 찬양방송"}</small>
      </div>
      <PlayButton status={p.status} onToggle={p.onToggle} size={40} />
      <div className="mini__vol">
        <VolumeControl volume={p.volume} onVolume={p.onVolume} muted={p.muted} onMute={p.onMute} />
      </div>
      <div className="mini__side">
        <button
          className={`icon-btn ${p.pinned ? "is-on" : ""}`}
          onClick={p.onPin}
          title={p.pinned ? "항상 위 해제" : "항상 위에 표시"}
        >
          <PinIcon size={14} />
        </button>
        <button className="icon-btn" onClick={p.onExpand} title="큰 화면">
          <ExpandIcon size={14} />
        </button>
      </div>
    </div>
  );
}
