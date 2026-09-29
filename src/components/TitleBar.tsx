import { hideToTray, minimize } from "../lib/tauri";
import { CloseIcon, MinusIcon, ShrinkIcon } from "./Icons";

export function TitleBar({ onMini }: { onMini: () => void }) {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <span className="brand" data-tauri-drag-region>
        <img src="/logo.svg" alt="" width={18} height={18} data-tauri-drag-region />
        WOWCCM
      </span>
      <div className="titlebar__btns">
        <button className="icon-btn" title="미니 모드" onClick={onMini}>
          <ShrinkIcon size={15} />
        </button>
        <button className="icon-btn" title="최소화" onClick={minimize}>
          <MinusIcon size={15} />
        </button>
        <button className="icon-btn" title="닫기 (트레이에서 계속 재생)" onClick={hideToTray}>
          <CloseIcon size={15} />
        </button>
      </div>
    </header>
  );
}
