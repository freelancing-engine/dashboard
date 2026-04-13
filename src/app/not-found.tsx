import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-6xl opacity-60">📭</div>
      <h1 className="font-display text-4xl font-bold text-gradient">404</h1>
      <p className="max-w-md text-[var(--color-text-muted)]">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        className="btn-primary mt-2 inline-block rounded-lg px-6 py-2 text-sm font-semibold"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
