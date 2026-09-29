import type { UpdateState } from "../lib/useUpdater";
import { CloseIcon } from "./Icons";

/** 헤더 바로 아래에 붙는 업데이트 알림 띠 */
export function UpdateBar({ state, onInstall, onDismiss }: { state: UpdateState; onInstall: () => void; onDismiss: () => void }) {
  if (state.kind === "none") return null;
  return (
    <div className={`updatebar ${state.kind === "error" ? "updatebar--error" : ""}`}>
      {state.kind === "available" && (
        <>
          <span className="updatebar__text">
            <b>새 버전 {state.version}</b>이 나왔습니다.
          </span>
          <button className="updatebar__btn" onClick={onInstall}>
            지금 업데이트
          </button>
          <button className="updatebar__close" onClick={onDismiss} title="다음에 하기" aria-label="다음에 하기">
            <CloseIcon size={12} />
          </button>
        </>
      )}
      {state.kind === "downloading" && (
        <span className="updatebar__text">
          업데이트를 받는 중입니다{state.percent !== null ? ` · ${state.percent}%` : "…"} 끝나면 플레이어가 다시 켜집니다.
        </span>
      )}
      {state.kind === "error" && (
        <>
          <span className="updatebar__text">업데이트하지 못했습니다. 잠시 후 다시 시도해 주세요.</span>
          <button className="updatebar__btn" onClick={onInstall}>
            다시 시도
          </button>
        </>
      )}
    </div>
  );
}
