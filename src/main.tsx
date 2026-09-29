import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// 한글 글꼴 Pretendard(무료, SIL OFL): Windows·Mac에서 같은 모양과 세밀한 굵기를 쓰기 위해 앱에 넣는다
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
