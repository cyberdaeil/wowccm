// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveTheme, sleepState, SLEEP_FADE_MS } from "./settings";

describe("화면 밝기", () => {
  it("자동이면 시스템 설정을 따른다", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
  it("밝게·어둡게를 고르면 시스템과 상관없이 고정", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("취침 예약", () => {
  const end = 1_000_000_000;
  it("시간이 넉넉하면 소리 그대로, 남은 분은 올림", () => {
    expect(sleepState(end, end - 60 * 60_000)).toEqual({ expired: false, fade: 1, minutesLeft: 60 });
    expect(sleepState(end, end - 59 * 60_000 - 1).minutesLeft).toBe(60);
    expect(sleepState(end, end - 90_000).minutesLeft).toBe(2);
  });
  it("마지막 30초 동안 소리를 서서히 줄인다", () => {
    expect(sleepState(end, end - SLEEP_FADE_MS).fade).toBe(1);
    expect(sleepState(end, end - SLEEP_FADE_MS / 2).fade).toBeCloseTo(0.5);
    expect(sleepState(end, end - 1000).fade).toBeCloseTo(1 / 30);
  });
  it("시간이 되면 끝 (창을 숨겨 늦게 확인해도 끝)", () => {
    expect(sleepState(end, end)).toEqual({ expired: true, fade: 0, minutesLeft: 0 });
    expect(sleepState(end, end + 5 * 60_000).expired).toBe(true);
  });
});
