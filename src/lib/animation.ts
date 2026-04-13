/* ─────────────────────────────────────────────────────────
   Liquid Signal — Animation Constants
   Shared easing curves, spring configs, and stagger values.
   ───────────────────────────────────────────────────────── */

// Cubic-bezier curves — typed as 4-tuples for Framer Motion compatibility
export const EASING_ENTRANCE: [number, number, number, number] = [
  0.34, 1.56, 0.64, 1,
]; // springy overshoot
export const EASING_EXIT: [number, number, number, number] = [0.65, 0, 0.35, 1]; // smooth symmetrical
export const EASING_DATA: [number, number, number, number] = [0.16, 1, 0.3, 1]; // fast start, slow settle

// CSS string versions (for inline styles / globals.css)
export const EASING_ENTRANCE_CSS = "cubic-bezier(0.34, 1.56, 0.64, 1)";
export const EASING_EXIT_CSS = "cubic-bezier(0.65, 0, 0.35, 1)";
export const EASING_DATA_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

// Spring configs (Framer Motion `transition`)
export const SPRING_INTERACTIVE = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

export const SPRING_CURSOR = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

// Stagger delays (seconds)
export const STAGGER_DEFAULT = 0.06; // 60ms between siblings
export const STAGGER_FAST = 0.04; // 40ms for digit animations
