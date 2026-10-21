import { useCallback, useEffect, useState } from "react";

// ── 화면 밝기 (자동 / 밝게 / 어둡게) ─────────────────────────────

export type ThemePref = "auto" | "light" | "dark";
const THEME_KEY = "wowccm.theme";

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export function resolveTheme(pref: ThemePref, sysDark: boolean): "light" | "dark" {
  return pref === "auto" ? (sysDark ? "dark" : "light") : pref;
}

/** 화면이 그려지기 전에 한 번: 켤 때 하얗게 번쩍이지 않도록 */
export function applyThemeEarly() {
  document.documentElement.dataset.theme = resolveTheme(loadThemePref(), systemDark());
}

/** "자동"이면 Windows·Mac의 밝기 설정을 따라가고, 저녁에 시스템이 바뀌면 함께 바뀐다 */
export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(loadThemePref);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme = resolveTheme(pref, sysDark);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      localStorage.setItem(THEME_KEY, p);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, []);

  return { pref, theme, setPref };
}

// ── 취침 예약 ────────────────────────────────────────────────

export const SLEEP_CHOICES = [30, 60, 90] as const;
/** 끄기 전 이 시간 동안 소리를 서서히 줄인다 */
export const SLEEP_FADE_MS = 30_000;

/** 남은 시간으로 지금 상태를 계산한다 (시험하기 쉽게 따로 둔다) */
export function sleepState(endAt: number, now: number) {
  const left = endAt - now;
  return {
    expired: left <= 0,
    /** 소리 크기 배율 (1 → 0) */
    fade: left <= 0 ? 0 : Math.min(1, left / SLEEP_FADE_MS),
    /** 화면에 보여 줄 남은 분 (올림) */
    minutesLeft: Math.max(0, Math.ceil(left / 60_000)),
  };
}

/**
 * 정한 시간이 지나면 방송을 끈다. 마지막 30초 동안 소리를 줄인다.
 * 창을 숨겨 둔 동안 타이머가 늦게 깨어나도, 시각을 기준으로 계산하므로 늦게라도 정확히 끈다.
 */
export function useSleepTimer(onExpire: () => void, onFade: (f: number) => void) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endAt]);

  useEffect(() => {
    if (endAt === null) return;
    const st = sleepState(endAt, now);
    if (st.expired) {
      setEndAt(null);
      onExpire();
      onFade(1);
    } else {
      onFade(st.fade);
    }
    // onExpire/onFade는 매번 새로 만들어져도 상관없다
  }, [now, endAt]);

  const start = useCallback((minutes: number) => {
    const t = Date.now();
    setNow(t);
    setEndAt(t + minutes * 60_000);
    setChosen(minutes);
  }, []);

  const cancel = useCallback(() => {
    setEndAt(null);
    onFade(1);
  }, []);

  return {
    active: endAt !== null,
    /** 고른 시간 (30·60·90분) */
    chosen: endAt === null ? null : chosen,
    minutesLeft: endAt === null ? null : sleepState(endAt, now).minutesLeft,
    start,
    cancel,
  };
}
