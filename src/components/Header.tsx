import { minimize } from "../lib/tauri";
import { CloseIcon, GearIcon, MinusIcon, MoonIcon, PanelIcon, ShrinkIcon } from "./Icons";

interface Props {
  onAir: boolean;
  onMini: () => void;
  sideOpen: boolean;
  onToggleSide: () => void;
  onClose: () => void;
  settingsOpen: boolean;
  onSettings: () => void;
  /** 취침 예약 남은 분 (꺼져 있으면 null) */
  sleepLeft: number | null;
}

export function Header({ onAir, onMini, sideOpen, onToggleSide, onClose, settingsOpen, onSettings, sleepLeft }: Props) {
  return (
    <header className="header" data-tauri-drag-region>
      <div className="logo" data-tauri-drag-region>
        <img src="/wowccm-logo.png" alt="WOWCCM" className="logo__img" data-tauri-drag-region />
        <small data-tauri-drag-region>와플</small>
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
        {sleepLeft !== null && (
          <button className="sleepchip" data-settings-toggle onClick={onSettings} title="취침 예약 (누르면 바꾸거나 끌 수 있습니다)">
            <MoonIcon size={12} />
            {sleepLeft}분
          </button>
        )}
        <div className="winbtns">
          <button
            className={`winbtn ${settingsOpen ? "is-on" : ""}`}
            data-settings-toggle
            title="설정 (화면 밝기·취침 예약·자동 실행)" onClick={onSettings}>
            <GearIcon size={15} />
          </button>
          <button className="winbtn" title="미니 모드" onClick={onMini}>
            <ShrinkIcon size={14} />
          </button>
          <button className="winbtn" title="최소화" onClick={minimize}>
            <MinusIcon size={14} />
          </button>
          <button className="winbtn" title="닫기 (트레이에서 계속 재생)" onClick={onClose}>
            <CloseIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
