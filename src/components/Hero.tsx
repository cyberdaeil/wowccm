import { LINKS } from "../config";
import { openUrl } from "../lib/tauri";
import { Marquee } from "./Marquee";
import { CloseIcon } from "./Icons";

interface Props {
  image: string | null;
  onAir: boolean;
  program: string;
  song: string | null;
  /** 보이는 방송을 보는 중이면 영상 주소 */
  video: { src: string; onClose: () => void; onBrowser: () => void } | null;
}

/** 진행자 이미지(보이는 방송 중에는 영상) + 프로그램명 + 현재 곡 */
export function Hero({ image, onAir, program, song, video }: Props) {
  return (
    <section className="hero">
      {video ? (
        <div className="cover cover--video">
          <iframe
            src={video.src}
            title="WOWCCM 보이는 방송"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <button className="video-close" onClick={video.onClose} title="영상 닫기" aria-label="영상 닫기">
            <CloseIcon size={14} />
          </button>
        </div>
      ) : (
        <div className="cover">
          {image ? <img src={image} alt="현재 방송 진행자" /> : <div className="cover__empty">WOWCCM</div>}
          {onAir && <span className="onair-mark">ON AIR</span>}
        </div>
      )}
      <div className="nowinfo">
        <h1 className="nowinfo__program">{program || "WOWCCM 24시간 찬양방송"}</h1>
        <div className="nowinfo__song">
          {video ? (
            <>
              <span className="watching">
                <i /> 보이는 방송 시청 중
              </span>
              <button className="lyrics" onClick={video.onBrowser}>
                [브라우저로 보기]
              </button>
            </>
          ) : song ? (
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
