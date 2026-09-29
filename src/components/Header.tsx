import { hideToTray, minimize } from "../lib/tauri";
import { CloseIcon, MinusIcon, PanelIcon, ShrinkIcon } from "./Icons";

interface Props {
  onAir: boolean;
  onMini: () => void;
  sideOpen: boolean;
  onToggleSide: () => void;
}

export function Header({ onAir, onMini, sideOpen, onToggleSide }: Props) {
  return (
    <header className="header" data-tauri-drag-region>
      <div className="logo" data-tauri-drag-region>
        <span className="logo__wow">WOW</span>CCM
        <small>PLAYER</small>
      </div>
      <div className="header__right" data-tauri-drag-region>
        <span className={`live ${onAir ? "" : "live--off"}`}>● LIVE</span>
        <button
          className={`sidebtn ${sideOpen ? "is-on" : ""}`}
          onClick={onToggleSide}
          title={sideOpen ? "오른쪽 창 접기" : "사연·다시듣기·방송시간표 펼치기"}
        >
          <PanelIcon size={14} />
          <span>{sideOpen ? "접기" : "펼치기"}</span>
        </button>
        <div className="winbtns">
          <button className="winbtn" title="미니 모드" onClick={onMini}>
            <ShrinkIcon size={14} />
          </button>
          <button className="winbtn" title="최소화" onClick={minimize}>
            <MinusIcon size={14} />
          </button>
          <button className="winbtn" title="닫기 (트레이에서 계속 재생)" onClick={hideToTray}>
            <CloseIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
