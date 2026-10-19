# 사진 → 영상 만들기

사진 한 장(+ 음악)으로 mp4를 만드는 웹 페이지입니다. 서버가 필요 없고, 변환은 브라우저 안에서 일어납니다.

- 길이: 30초 / 1분 / 1분 30초 / 2분
- 크기: 가로 1920×1080, 세로 1080×1920
- 음악: 선택. 짧으면 반복, 길면 자르고, 끝 2초는 서서히 작아집니다.
- 필요한 것: 최신 크롬 또는 엣지 (WebCodecs 사용)

사용: `index.html`을 웹 서버로 열어야 합니다. 예) `cd tools/img2mp4 && python3 -m http.server 8000` 후 http://localhost:8000
(`file://` 로 직접 열면 브라우저가 모듈 로드를 막습니다.)

`mp4-muxer.mjs`는 [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) 5.1.3 (MIT)입니다.
