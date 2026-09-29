import { useState } from "react";
import type { RequestPost } from "../lib/api";
import { postRequest } from "../lib/api";

const NAME_KEY = "wowccm.name";
const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};

interface Props {
  posts: RequestPost[] | null;
  error: boolean;
  onPosted: () => void;
}

export function RequestPanel({ posts, error, onPosted }: Props) {
  const [name, setName] = useState(savedName);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async () => {
    if (sending) return;
    if (!name.trim() || !content.trim()) {
      setNotice("이름과 내용을 입력해 주세요.");
      return;
    }
    setSending(true);
    setNotice("");
    const r = await postRequest(name, content);
    setSending(false);
    if (!r.ok) {
      setNotice(r.message || "등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      /* 무시 */
    }
    setContent("");
    onPosted();
  };

  return (
    <div className="panel panel--request">
      <div className="rows rows--scroll">
        {posts === null && !error && <p className="rows__empty">사연을 불러오는 중…</p>}
        {posts === null && error && <p className="rows__empty">사연을 불러오지 못했습니다.</p>}
        {posts?.length === 0 && <p className="rows__empty">첫 사연을 남겨 주세요.</p>}
        {posts?.map((p, i) => (
          <div className="req" key={`${p.day}${p.clock}${p.name}${i}`}>
            <div className="req__name">{p.name}</div>
            <div className="req__content">{p.content}</div>
            <div className="req__date">
              <span>{p.day}</span>
              <span>{p.clock}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="write-dock">
        <form
          className="write"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            className="write__name"
            value={name}
            maxLength={5}
            placeholder="이름"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="write__msg"
            value={content}
            placeholder="사연 또는 신청곡을 입력해 주세요"
            onChange={(e) => setContent(e.target.value)}
          />
          <button className="write__send" disabled={sending}>
            {sending ? "등록중" : "등록"}
          </button>
        </form>
        {notice && <p className="write__notice">{notice}</p>}
      </div>
    </div>
  );
}
