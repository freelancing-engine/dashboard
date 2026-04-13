"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface A11yContextValue {
  /** True when animations should be suppressed (OS preference OR user toggle) */
  reduceMotion: boolean;
  /** User explicit toggle (independent of OS) */
  animationsDisabled: boolean;
  toggleAnimations: () => void;
}

const A11yContext = createContext<A11yContextValue>({
  reduceMotion: false,
  animationsDisabled: false,
  toggleAnimations: () => {},
});

const STORAGE_KEY = "fe-reduce-motion";

export function A11yProvider({ children }: { children: ReactNode }) {
  const [osPrefers, setOsPrefers] = useState(false);
  const [userDisabled, setUserDisabled] = useState(false);

  // Read OS preference + localStorage on mount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsPrefers(mq.matches);

    const handler = (e: MediaQueryListEvent) => setOsPrefers(e.matches);
    mq.addEventListener("change", handler);

    // Restore user preference
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setUserDisabled(true);
    } catch {
      /* storage unavailable */
    }

    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleAnimations = useCallback(() => {
    setUserDisabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const reduceMotion = osPrefers || userDisabled;

  // Sync a data attribute on <html> so CSS can react
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduce-motion",
      reduceMotion ? "true" : "false",
    );
  }, [reduceMotion]);

  return (
    <A11yContext.Provider
      value={{
        reduceMotion,
        animationsDisabled: userDisabled,
        toggleAnimations,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  return useContext(A11yContext);
}
