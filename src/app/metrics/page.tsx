import Link from "next/link";
import { getMetrics } from "@/lib/leads";
import {
  StatusChart,
  VerdictChart,
  PlatformChart,
  ProfileChart,
  DailyIntakeChart,
  ScoreDistributionChart,
} from "./charts";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const metrics = await getMetrics();
  const { scoreStats } = metrics;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Métricas</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Volver al listado
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total leads</div>
          <div className="text-3xl font-bold">{scoreStats.total}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Puntaje promedio</div>
          <div className="text-3xl font-bold">{scoreStats.avg ?? "—"}</div>
          <div className="text-xs text-gray-400">
            Rango: {scoreStats.min}–{scoreStats.max}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Alta prioridad</div>
          <div className="text-3xl font-bold text-green-600">
            {metrics.verdictBreakdown.find((v) => v.name === "apply_now")
              ?.value || 0}
          </div>
          <div className="text-xs text-gray-400">Veredicto: Aplicar ya</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Para revisar</div>
          <div className="text-3xl font-bold text-amber-600">
            {metrics.statusBreakdown.find((s) => s.name === "needs_review")
              ?.value || 0}
          </div>
          <div className="text-xs text-gray-400">Pendientes de decisión</div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Pipeline de leads
          </h2>
          <StatusChart data={metrics.statusBreakdown} />
        </div>

        {/* Score distribution */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Distribución de puntajes
          </h2>
          <ScoreDistributionChart data={metrics.scoreDistribution} />
        </div>

        {/* Verdict */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Veredictos
          </h2>
          <VerdictChart data={metrics.verdictBreakdown} />
        </div>

        {/* Platform */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Plataformas
          </h2>
          <PlatformChart data={metrics.platformBreakdown} />
        </div>

        {/* Profile angles */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Ángulos de perfil
          </h2>
          <ProfileChart data={metrics.profileBreakdown} />
        </div>

        {/* Daily intake */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Leads por día
          </h2>
          <DailyIntakeChart data={metrics.dailyIntake} />
        </div>
      </div>
    </main>
  );
}
