import type { LiveStatus } from "../lib/usePlayer";
import { Marquee } from "./Marquee";
import { PlayButton, Volume } from "./PlayerControls";
import { ExpandIcon, PinIcon } from "./Icons";

interface Props {
  image: string | null;
  program: string;
  song: string;
  status: LiveStatus;
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
      {p.image ? (
        <img src={p.image} alt="" className="mini__thumb" data-tauri-drag-region />
      ) : (
        <div className="mini__thumb mini__thumb--empty" data-tauri-drag-region />
      )}
      <div className="mini__meta" data-tauri-drag-region>
        <b data-tauri-drag-region>{p.program}</b>
        <Marquee text={p.song} className="mini__song" />
      </div>
      <PlayButton status={p.status} onToggle={p.onToggle} size={40} />
      <Volume volume={p.volume} onVolume={p.onVolume} muted={p.muted} onMute={p.onMute} compact />
      <div className="mini__side">
        <button className={`winbtn ${p.pinned ? "is-on" : ""}`} onClick={p.onPin} title={p.pinned ? "항상 위 해제" : "항상 위에 표시"}>
          <PinIcon size={13} />
        </button>
        <button className="winbtn" onClick={p.onExpand} title="큰 화면">
          <ExpandIcon size={13} />
        </button>
      </div>
    </div>
  );
}
