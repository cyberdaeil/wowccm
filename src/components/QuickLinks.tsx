import { openUrl } from "../lib/tauri";
import { LINKS } from "../config";
import { ChatIcon, HeartIcon, TvIcon } from "./Icons";

const ITEMS = [
  { key: "visibleRadio", label: "보이는 방송", icon: <TvIcon size={18} /> },
  { key: "chat", label: "대화방", icon: <ChatIcon size={18} /> },
  { key: "support", label: "선교후원", icon: <HeartIcon size={18} /> },
] as const;

export function QuickLinks() {
  return (
    <nav className="quick">
      {ITEMS.map((it) => {
        const url = LINKS[it.key];
        return (
          <button
            key={it.key}
            className="quick__btn"
            disabled={!url}
            title={url ? it.label : `${it.label} (링크 준비 중)`}
            onClick={() => url && openUrl(url)}
          >
            {it.icon}
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
