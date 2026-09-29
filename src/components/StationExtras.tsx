import { useEffect, useState } from "react";
import { LINKS } from "../config";
import type { Notice } from "../lib/api";
import { openUrl } from "../lib/tauri";
import { HeartIcon, TvIcon } from "./Icons";

/** 보이는 방송·선교후원 바로가기와 공지 한 줄 */
export function StationExtras({ notices }: { notices: Notice[] | null }) {
  const [i, setI] = useState(0);
  const list = notices ?? [];

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % list.length), 5000);
    return () => window.clearInterval(id);
  }, [list.length]);

  const n = list.length ? list[i % list.length] : null;

  return (
    <section className="extras">
      <div className="extras__links">
        <button className="linkbtn" onClick={() => openUrl(LINKS.visibleRadio)}>
          <TvIcon size={16} />
          보이는 방송
        </button>
        <button className="linkbtn" onClick={() => openUrl(LINKS.support)}>
          <HeartIcon size={16} />
          선교후원
        </button>
      </div>
      {n && (
        <button className="notice" onClick={() => n.link && openUrl(n.link)} title={n.title}>
          <span className="notice__tag">공지</span>
          <span key={i} className="notice__text">
            {n.title}
          </span>
          {n.date && <span className="notice__date">{n.date}</span>}
        </button>
      )}
    </section>
  );
}
