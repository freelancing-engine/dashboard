import Link from "next/link";
import { getMetrics } from "@/lib/leads";
import {
  StatusChart,
  VerdictChart,
  PlatformChart,
  ProfileChart,
  DailyIntakeChart,
  ScoreDistributionChart,
  SourceTypeChart,
} from "./charts";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const metrics = await getMetrics();
  const { scoreStats } = metrics;

  return (
    <main className="page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-gradient">
          Métricas
        </h1>
        <Link href="/" className="btn-secondary px-3 py-1.5 text-sm">
          ← Volver al listado
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card kpi-card kpi-card--primary animate-fade-in stagger-1 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Total leads
          </div>
          <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
            {scoreStats.total}
          </div>
        </div>
        <div className="card kpi-card kpi-card--accent animate-fade-in stagger-2 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Puntaje promedio
          </div>
          <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
            {scoreStats.avg ?? "—"}
          </div>
          <div className="kpi-number mt-0.5 text-xs text-[var(--color-text-muted)]">
            Rango: {scoreStats.min}–{scoreStats.max}
          </div>
        </div>
        <div className="card kpi-card kpi-card--success animate-fade-in stagger-3 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Alta prioridad
          </div>
          <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-success)]">
            {metrics.verdictBreakdown.find((v) => v.name === "apply_now")
              ?.value || 0}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Veredicto: Aplicar ya
          </div>
        </div>
        <div className="card kpi-card kpi-card--warning animate-fade-in stagger-4 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Para revisar
          </div>
          <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-warning)]">
            {metrics.statusBreakdown.find((s) => s.name === "needs_review")
              ?.value || 0}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Pendientes de decisión
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="card-elevated animate-fade-in-up p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Pipeline de leads
          </h2>
          <StatusChart data={metrics.statusBreakdown} />
        </div>

        {/* Score distribution */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "60ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Distribución de puntajes
          </h2>
          <ScoreDistributionChart data={metrics.scoreDistribution} />
        </div>

        {/* Verdict */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Veredictos
          </h2>
          <VerdictChart data={metrics.verdictBreakdown} />
        </div>

        {/* Platform */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Plataformas
          </h2>
          <PlatformChart data={metrics.platformBreakdown} />
        </div>

        {/* Profile angles */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "240ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Ángulos de perfil
          </h2>
          <ProfileChart data={metrics.profileBreakdown} />
        </div>

        {/* Daily intake */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "300ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Leads por día
          </h2>
          <DailyIntakeChart data={metrics.dailyIntake} />
        </div>

        {/* Source type attribution */}
        <div
          className="card-elevated animate-fade-in-up p-4"
          style={{ animationDelay: "360ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            Origen de leads
          </h2>
          <SourceTypeChart data={metrics.sourceTypeBreakdown} />
        </div>
      </div>
    </main>
  );
}
