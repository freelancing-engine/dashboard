export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-surface-2)] border-t-[var(--color-primary)] opacity-80" />
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-accent)]"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-accent-2)]"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <p className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]">
        Cargando…
      </p>
    </div>
  );
}
