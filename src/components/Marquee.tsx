import { useLayoutEffect, useRef, useState } from "react";

/** 칸을 넘치는 글자만 천천히 흘려 보낸다 (기존 곡명 표시 방식). */
export function Marquee({ text, className }: { text: string; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [dist, setDist] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!box.current || !inner.current) return;
      const over = inner.current.scrollWidth - box.current.clientWidth;
      setDist(over > 1 ? over + 12 : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <span ref={box} className={`marquee ${className ?? ""}`} title={text}>
      <span
        ref={inner}
        className={dist ? "marquee__run" : ""}
        style={
          dist
            ? {
                ["--dist" as string]: `-${dist}px`,
                ["--dur" as string]: `${Math.max(8, dist / 22 + 4)}s`,
              }
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}
