import { LINKS } from "../config";
import type { RecastItem } from "../lib/api";
import { openUrl } from "../lib/tauri";
import { PauseIcon, PlayIcon } from "./Icons";

interface Props {
  items: RecastItem[] | null;
  currentUrl: string | null;
  playing: boolean;
  onToggle: (url: string) => void;
}

export function RecastPanel({ items, currentUrl, playing, onToggle }: Props) {
  return (
    <div className="panel">
      <div className="rows">
        {items === null && <p className="rows__empty">다시듣기 목록을 불러오는 중…</p>}
        {items?.length === 0 && <p className="rows__empty">다시듣기 방송이 없습니다.</p>}
        {items?.map((r) => {
          const active = currentUrl === r.audio;
          const on = active && playing;
          return (
            <div className={`recast ${active ? "is-active" : ""}`} key={r.audio}>
              <div className="recast__meta">
                <strong>{r.program}</strong>
                <span>
                  {r.date}
                  {on && <em> · 재생 중</em>}
                </span>
              </div>
              <button
                className="recast__btn"
                onClick={() => onToggle(r.audio)}
                aria-label={on ? "다시듣기 일시정지" : "다시듣기 재생"}
              >
                {on ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
            </div>
          );
        })}
      </div>
      <button className="more-link" onClick={() => openUrl(LINKS.recastAll)}>
        전체 다시듣기 ›
      </button>
    </div>
  );
}
