import { getLeads, getStatusCounts, getScoreStats } from "@/lib/leads";
import { LeadTable } from "./components/lead-table";
import { StatsBar } from "./components/stats-bar";
import { Filters } from "./components/filters";
import Link from "next/link";

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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Freelancing Engine — Leads</h1>
        <Link
          href="/metrics"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver métricas
        </Link>
      </div>

      <StatsBar statusCounts={statusCounts} scoreStats={scoreStats} />

      <Filters
        currentStatus={params.status}
        currentPlatform={params.platform}
        currentSearch={params.search}
      />

      <LeadTable leads={leads} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            {total} leads — página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
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
