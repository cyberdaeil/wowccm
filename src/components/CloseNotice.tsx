import { isMac } from "../lib/tauri";

/** 처음 X를 누를 때 한 번만: 창을 닫아도 방송은 계속 나온다는 안내 */
export function CloseNotice({ onHide, onQuit }: { onHide: () => void; onQuit: () => void }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="close-notice-title">
      <div className="modal__box">
        <h2 id="close-notice-title" className="modal__title">
          창을 닫아도 방송은 계속 나옵니다
        </h2>
        <p className="modal__text">
          일하면서도 찬양을 계속 들으실 수 있도록, 창만 숨기고 방송은 이어집니다.
        </p>
        <div className="modal__tip">
          <b>플레이어를 완전히 끄려면</b>
          <br />
          {isMac ? (
            <>
              화면 <b>위쪽 메뉴바</b>의 와우씨씨엠 아이콘 → <b>종료</b>
              <br />
              (또는 플레이어 창에서 ⌘Q)
            </>
          ) : (
            <>
              화면 <b>오른쪽 아래</b> 작업 표시줄의 와우씨씨엠 아이콘을 오른쪽 클릭 → <b>종료</b>
              <br />
              (아이콘이 안 보이면 ˄ 표시를 눌러 보세요)
            </>
          )}
        </div>
        <div className="modal__btns">
          <button className="modal__btn modal__btn--sub" onClick={onQuit}>
            지금 플레이어 끄기
          </button>
          <button className="modal__btn" onClick={onHide} autoFocus>
            알겠어요
          </button>
        </div>
      </div>
    </div>
  );
}
