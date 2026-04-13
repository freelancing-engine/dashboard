"use client";

import { useA11y } from "./accessibility-provider";

export default function AccessibilityToggle() {
  const { reduceMotion, animationsDisabled, toggleAnimations } = useA11y();

  return (
    <button
      onClick={toggleAnimations}
      aria-pressed={animationsDisabled}
      aria-label={
        animationsDisabled ? "Activar animaciones" : "Desactivar animaciones"
      }
      title={
        animationsDisabled ? "Activar animaciones" : "Desactivar animaciones"
      }
      className="fixed bottom-4 right-4 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] shadow-md transition-colors hover:border-[var(--color-accent2)] hover:text-[var(--color-accent2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a0ff7a] focus-visible:outline-offset-2"
    >
      {reduceMotion ? (
        /* Play icon — animations off */
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ) : (
        /* Pause icon — animations on */
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      )}
    </button>
  );
}
