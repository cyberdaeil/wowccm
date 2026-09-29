import { hideToTray, minimize } from "../lib/tauri";
import { CloseIcon, MinusIcon, ShrinkIcon } from "./Icons";

export function Header({ onAir, onMini }: { onAir: boolean; onMini: () => void }) {
  return (
    <header className="header" data-tauri-drag-region>
      <div className="logo" data-tauri-drag-region>
        <span className="logo__wow">WOW</span>CCM
        <small>PLAYER</small>
      </div>
      <div className="header__right">
        <span className={`live ${onAir ? "" : "live--off"}`}>● LIVE</span>
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
