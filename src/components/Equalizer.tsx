/** 재생 중일 때 움직이는 막대. 앨범아트가 없을 때 화면을 살려 준다. */
export function Equalizer({ active }: { active: boolean }) {
  return (
    <span className={`eq ${active ? "eq--on" : ""}`} aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
