import { useState } from "react";
import type { TrackEntry } from "../lib/useNowPlaying";
import { splitTitle } from "../lib/tauri";

type TabKey = "letters" | "schedule" | "recent";

const TABS: { key: TabKey; label: string }[] = [
  { key: "letters", label: "사연·신청곡" },
  { key: "schedule", label: "편성표" },
  { key: "recent", label: "최근 곡" },
];

const time = (d: Date) =>
  d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

export function Tabs({ history }: { history: TrackEntry[] }) {
  const [tab, setTab] = useState<TabKey>("letters");
  return (
    <section className="tabs">
      <div className="tabs__bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`tabs__tab ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tabs__body">
        {tab === "letters" && <Letters />}
        {tab === "schedule" && (
          <Empty
            title="편성표 준비 중"
            desc="편성표 데이터 주소가 정해지면 요일별 프로그램이 여기에 표시됩니다."
          />
        )}
        {tab === "recent" &&
          (history.length === 0 ? (
            <Empty
              title="아직 기록된 곡이 없어요"
              desc="플레이어를 켜 두면 방송에 흐른 찬양이 여기에 차곡차곡 쌓입니다."
            />
          ) : (
            <ul className="list">
              {history.map((h, i) => {
                const t = splitTitle(h.raw)!;
                return (
                  <li key={`${h.at.getTime()}-${i}`} className="list__item">
                    <span className="list__time">{time(h.at)}</span>
                    <span className="list__main">
                      <b>{t.title}</b>
                      {t.artist && <small>{t.artist}</small>}
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </section>
  );
}

function Letters() {
  return (
    <div className="letters">
      <Empty
        title="사연 게시판 연결 준비 중"
        desc="기존 사연&신청곡 게시판과 연결하면, 청취자들의 사연이 채팅처럼 실시간으로 올라옵니다."
      />
      <form className="letters__form" onSubmit={(e) => e.preventDefault()}>
        <input className="letters__name" placeholder="이름" disabled />
        <input className="letters__msg" placeholder="사연 또는 신청곡" disabled />
        <button className="letters__send" disabled>
          등록
        </button>
      </form>
    </div>
  );
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{desc}</p>
    </div>
  );
}
