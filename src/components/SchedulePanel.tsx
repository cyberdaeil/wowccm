import { LINKS } from "../config";
import type { ScheduleItem } from "../lib/api";
import { openUrl } from "../lib/tauri";

export function SchedulePanel({ items }: { items: ScheduleItem[] | null }) {
  return (
    <div className="panel">
      <div className="rows">
        {items === null && <p className="rows__empty">편성 정보를 불러오는 중…</p>}
        {items?.length === 0 && <p className="rows__empty">편성 정보를 불러오지 못했습니다.</p>}
        {items?.map((s, i) => (
          <div className={`sch ${s.onair ? "is-onair" : ""}`} key={`${s.time}${s.title}${i}`}>
            <div className="sch__time">{s.time || "—"}</div>
            <div className="sch__info">
              <div className="sch__title">
                {s.title}
                {s.onair && <span className="badge">ON AIR</span>}
              </div>
              {s.sub && <div className="sch__sub">└ {s.sub}</div>}
            </div>
          </div>
        ))}
      </div>
      <button className="more-btn" onClick={() => openUrl(LINKS.scheduleAll)}>
        전체 방송시간표 보기
      </button>
    </div>
  );
}
