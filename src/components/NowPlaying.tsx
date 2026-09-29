import { STATION } from "../config";
import { Equalizer } from "./Equalizer";

interface Props {
  title: string | null;
  artist: string;
  playing: boolean;
}

/** 앨범아트 자리와 현재 곡. 곡 정보를 못 받으면 방송국 이름을 보여준다. */
export function NowPlaying({ title, artist, playing }: Props) {
  return (
    <section className="now">
      <div className={`art ${playing ? "art--on" : ""}`}>
        <img src="/logo-mark.svg" alt="" className="art__logo" />
        <Equalizer active={playing} />
      </div>
      <div className="now__meta">
        <h1 className="now__title" title={title ?? undefined}>
          {title ?? STATION.slogan}
        </h1>
        <p className="now__artist">{artist || (title ? "" : "지금 이 시간, 찬양으로 함께합니다")}</p>
      </div>
    </section>
  );
}
