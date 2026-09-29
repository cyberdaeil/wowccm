import { STATION } from "../config";

/** 현재 프로그램. 편성표 데이터가 연결되기 전까지는 24시간 방송 정보를 보여준다. */
export function ProgramCard({ onAir }: { onAir: boolean }) {
  return (
    <section className="program">
      <div className="program__thumb" aria-hidden>
        24
      </div>
      <div className="program__info">
        <span className={`onair ${onAir ? "onair--live" : ""}`}>
          <i /> ON AIR
        </span>
        <strong>{STATION.slogan}</strong>
        <small>진행 · 자동이 &nbsp;|&nbsp; 24H</small>
      </div>
    </section>
  );
}
