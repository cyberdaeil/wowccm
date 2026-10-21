import { useEffect, useRef, useState } from "react";
import { SLEEP_CHOICES, type ThemePref } from "../lib/settings";
import { autostartEnabled, isMac, setAutostart } from "../lib/tauri";

interface Props {
  theme: ThemePref;
  onTheme: (t: ThemePref) => void;
  sleepLeft: number | null;
  sleepChosen: number | null;
  onSleep: (minutes: number | null) => void;
  onClose: () => void;
}

const THEMES: { key: ThemePref; label: string }[] = [
  { key: "auto", label: "자동" },
  { key: "light", label: "밝게" },
  { key: "dark", label: "어둡게" },
];

/** 헤더 ⚙ 버튼으로 여는 설정: 화면 밝기, 취침 예약, 자동 실행 */
export function SettingsMenu({ theme, onTheme, sleepLeft, sleepChosen, onSleep, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState<boolean | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);

  useEffect(() => {
    void autostartEnabled().then(setAuto);
  }, []);

  // 바깥을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Element;
      // ⚙ 버튼은 스스로 열고 닫으므로 여기서는 건드리지 않는다
      if (t.closest?.("[data-settings-toggle]")) return;
      if (box.current && !box.current.contains(t)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const toggleAuto = async () => {
    if (auto === null || autoBusy) return;
    setAutoBusy(true);
    try {
      setAuto(await setAutostart(!auto));
    } catch {
      /* 실패하면 그대로 둔다 */
    } finally {
      setAutoBusy(false);
    }
  };

  return (
    <div className="settings" ref={box} role="dialog" aria-label="설정">
      <section className="settings__row">
        <span className="settings__label">화면</span>
        <div className="seg">
          {THEMES.map((t) => (
            <button key={t.key} className={`seg__btn ${theme === t.key ? "is-on" : ""}`} onClick={() => onTheme(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>
      {theme === "auto" && (
        <p className="settings__hint">{isMac ? "Mac" : "Windows"}의 밝기 설정(다크 모드)을 따라갑니다.</p>
      )}

      <section className="settings__row">
        <span className="settings__label">취침 예약</span>
        <div className="seg">
          <button className={`seg__btn ${sleepLeft === null ? "is-on" : ""}`} onClick={() => onSleep(null)}>
            끔
          </button>
          {SLEEP_CHOICES.map((m) => (
            <button key={m} className={`seg__btn ${sleepChosen === m ? "is-on" : ""}`} onClick={() => onSleep(m)}>
              {m}분
            </button>
          ))}
        </div>
      </section>
      {sleepLeft !== null && (
        <p className="settings__hint settings__hint--on">{sleepLeft}분 뒤에 소리를 서서히 줄이며 방송을 끕니다.</p>
      )}

      {auto !== null && (
        <section className="settings__row">
          <span className="settings__label">컴퓨터를 켜면 와플 자동 실행</span>
          <button
            className={`switch ${auto ? "is-on" : ""}`}
            role="switch"
            aria-checked={auto}
            disabled={autoBusy}
            onClick={() => void toggleAuto()}
          >
            <i />
          </button>
        </section>
      )}
    </div>
  );
}
