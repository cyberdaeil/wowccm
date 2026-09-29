import { LINKS } from "../config";
import { openUrl } from "../lib/tauri";
import { Marquee } from "./Marquee";

interface Props {
  image: string | null;
  onAir: boolean;
  program: string;
  song: string | null;
}

/** 진행자 이미지 + 프로그램명 + 현재 곡 */
export function Hero({ image, onAir, program, song }: Props) {
  return (
    <section className="hero">
      <div className="cover">
        {image ? <img src={image} alt="현재 방송 진행자" /> : <div className="cover__empty">WOWCCM</div>}
        {onAir && <span className="onair-mark">ON AIR</span>}
      </div>
      <div className="nowinfo">
        <h1 className="nowinfo__program">{program || "WOWCCM 24시간 찬양방송"}</h1>
        <div className="nowinfo__song">
          {song ? (
            <>
              <Marquee text={song} className="nowinfo__title" />
              <button className="lyrics" onClick={() => openUrl(LINKS.lyrics)}>
                [가사보기]
              </button>
            </>
          ) : (
            <span className="nowinfo__title nowinfo__title--muted">곡 정보를 불러오는 중…</span>
          )}
        </div>
      </div>
    </section>
  );
}
