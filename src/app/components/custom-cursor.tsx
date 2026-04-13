"use client";










</svg>  <text x="5" y="24" font-family="system-ui,sans-serif" font-weight="700" font-size="18" fill="url(#g)">FE</text>  <rect width="32" height="32" rx="6" fill="#0C0614"/>  </defs>    </linearGradient>      <stop offset="100%" stop-color="#5CE0D8"/>      <stop offset="0%" stop-color="#A0FF7A"/>    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { SPRING_CURSOR, SPRING_INTERACTIVE } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

type CursorState = "default" | "link" | "button" | "row" | "card" | "select";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<CursorState>("default");
  const [pressed, setPressed] = useState(false);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const { reduceMotion } = useA11y();

  // Raw mouse position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Follower follows with spring physics
  const followerX = useSpring(mouseX, SPRING_CURSOR);
  const followerY = useSpring(mouseY, SPRING_CURSOR);

  const updateCursorState = useCallback((target: HTMLElement) => {
    const cursorAttr = target
      .closest("[data-cursor]")
      ?.getAttribute("data-cursor");

    if (cursorAttr === "link" || target.closest("a")) {
      setState("link");
      setAccentColor(null);
    } else if (cursorAttr === "button" || target.closest("button")) {
      setState("button");
      setAccentColor(null);
    } else if (cursorAttr === "row" || target.closest("tr")) {
      setState("row");
      setAccentColor(null);
    } else if (cursorAttr === "card") {
      setState("card");
      const color = target
        .closest("[data-cursor]")
        ?.getAttribute("data-cursor-color");
      setAccentColor(color || null);
    } else {
      setState("default");
      setAccentColor(null);
    }
  }, []);

  useEffect(() => {
    // Hide on touch devices or when animations are disabled
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice || reduceMotion) return;

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
      if (keyboardActive) setKeyboardActive(false);
      updateCursorState(e.target as HTMLElement);
    };

    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") setKeyboardActive(true);
    };

    const handleSelectStart = () => setState("select");
    const handleSelectEnd = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setState("default");
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("selectionchange", handleSelectEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("selectionchange", handleSelectEnd);
    };
  }, [
    mouseX,
    mouseY,
    visible,
    keyboardActive,
    updateCursorState,
    reduceMotion,
  ]);

  // Don't render on touch / reduced-motion / keyboard navigation
  if (!visible || keyboardActive || reduceMotion) return null;

  // Derive sizes and styles per state
  const baseDotSize = 8;
  const baseFollowerSize = 32;
  const dotScale = state === "link" || state === "button" ? 6 / baseDotSize : 1;
  const followerScale =
    state === "link" || state === "button"
      ? 48 / baseFollowerSize
      : state === "row" || state === "card"
        ? 40 / baseFollowerSize
        : 1;

  const followerBorder =
    state === "row"
      ? "rgba(160, 255, 122, 0.5)"
      : state === "card" && accentColor
        ? accentColor
        : state === "select"
          ? "rgba(92, 224, 216, 0.5)"
          : "rgba(180, 160, 212, 0.3)";

  const followerBg =
    state === "button" ? "rgba(160, 255, 122, 0.08)" : "transparent";

  const blendMode = state === "link" ? "difference" : "normal";

  const dotAnimScale = pressed ? 0.7 * dotScale : dotScale;
  const followerScaleX = pressed
    ? 0.85 * followerScale
    : state === "select"
      ? 0.6 * followerScale
      : followerScale;
  const followerScaleY = pressed
    ? 0.85 * followerScale
    : state === "select"
      ? 1.2 * followerScale
      : followerScale;

  return (
    <div aria-hidden="true">
      {/* Inner dot — follows exactly */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          x: mouseX,
          y: mouseY,
          width: baseDotSize,
          height: baseDotSize,
          backgroundColor: "#F0EEFF",
          translateX: "-50%",
          translateY: "-50%",
          mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
          opacity: visible ? 1 : 0,
        }}
        animate={{ scale: dotAnimScale }}
        transition={pressed ? { duration: 0.1 } : SPRING_INTERACTIVE}
      />

      {/* Outer follower — spring-delayed */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full"
        style={{
          x: followerX,
          y: followerY,
          width: baseFollowerSize,
          height: baseFollowerSize,
          border: `1px solid ${followerBorder}`,
          backgroundColor: followerBg,
          translateX: "-50%",
          translateY: "-50%",
          mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
          opacity: visible ? 1 : 0,
        }}
        animate={{
          scaleX: followerScaleX,
          scaleY: followerScaleY,
        }}
        transition={pressed ? { duration: 0.1 } : SPRING_INTERACTIVE}
      />
    </div>
  );
}
