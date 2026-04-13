import { getLeads, getStatusCounts, getScoreStats } from "@/lib/leads";
import { LeadTable } from "./components/lead-table";
import { StatsBar } from "./components/stats-bar";
import { Filters } from "./components/filters";
import Link from "next/link";
import Image from "next/image";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    platform?: string;
    minScore?: string;
    search?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 25;
  const offset = (page - 1) * limit;

  const [{ leads, total }, statusCounts, scoreStats] = await Promise.all([
    getLeads({
      status: params.status,
      platform: params.platform,
      minScore: params.minScore ? parseInt(params.minScore) : undefined,
      search: params.search,
      limit,
      offset,
    }),
    getStatusCounts(),
    getScoreStats(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Freelancing Engine"
            width={40}
            height={40}
            priority
            className="drop-shadow-[0_0_8px_rgba(92,224,216,0.3)]"
          />
          <h1 className="font-display text-3xl font-bold text-gradient">
            Freelancing Engine
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profiles"
            className="btn-secondary px-4 py-2 text-sm font-medium"
          >
            Profile Builder
          </Link>
          <Link
            href="/metrics"
            className="btn-primary px-4 py-2 text-sm font-medium"
          >
            Ver métricas
          </Link>
        </div>
      </div>

      <StatsBar statusCounts={statusCounts} scoreStats={scoreStats} />

      <Filters
        currentStatus={params.status}
        currentPlatform={params.platform}
        currentSearch={params.search}
      />

      <LeadTable leads={leads} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span className="kpi-number">
            {total} leads — página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="btn-secondary px-3 py-1 text-xs"
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="btn-secondary px-3 py-1 text-xs"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
