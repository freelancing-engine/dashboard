import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="relative h-40 w-40 animate-pulse overflow-hidden rounded-2xl opacity-60">
        <Image
          src="/empty-state.png"
          alt="Loading"
          fill
          className="object-cover"
          style={{ objectPosition: "83% 50%" }}
          priority
        />
      </div>
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
