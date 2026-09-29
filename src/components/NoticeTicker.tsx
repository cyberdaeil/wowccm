import { useEffect, useState } from "react";
import { NOTICES } from "../config";
import { openUrl } from "../lib/tauri";
import { MegaphoneIcon } from "./Icons";

/** 공지를 한 줄씩 위로 넘긴다. 기존 플레이어의 흐르는 글자 띠를 대신한다. */
export function NoticeTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (NOTICES.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % NOTICES.length), 5000);
    return () => window.clearInterval(id);
  }, []);
  if (NOTICES.length === 0) return null;
  const n = NOTICES[i];
  return (
    <button
      className="notice"
      onClick={() => n.url && openUrl(n.url)}
      style={{ cursor: n.url ? "pointer" : "default" }}
    >
      <MegaphoneIcon size={15} />
      <span key={i} className="notice__text">
        {n.text}
      </span>
    </button>
  );
}
