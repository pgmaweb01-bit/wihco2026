import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminCheckInsFn } from "@/fns/admin-checkins";

export const Route = createFileRoute("/admin/check-ins")({
  component: AdminCheckInsPage,
});

interface CheckIn {
  id: string;
  attendeeId: string;
  name: string;
  email: string;
  organisation: string;
  category: string;
  checkedInAt: string;
  checkedInBy: string;
}

function AdminCheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminCheckInsFn({ data: { page, limit } })
      .then((result) => {
        setCheckIns(result.checkIns);
        setHasNext(result.pagination.totalPages > page);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fetch check-ins"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-primary p-6 font-body">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display mb-2 text-3xl font-bold text-accent">
          Check-In Logs
        </h1>
        <p className="mb-6 text-sm text-muted">
          Admin view of all attendee check-ins
        </p>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="text-lg text-accent animate-pulse">
              Loading check-ins...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">Attendee ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Checked In At</th>
                    <th className="px-4 py-3">Checked In By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {checkIns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted"
                      >
                        No check-ins found.
                      </td>
                    </tr>
                  ) : (
                    checkIns.map((ci) => (
                      <tr
                        key={ci.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-primary">
                          {ci.attendeeId}
                        </td>
                        <td className="px-4 py-3 font-medium text-primary">
                          {ci.name}
                        </td>
                        <td className="px-4 py-3 text-primary">{ci.email}</td>
                        <td className="px-4 py-3 text-primary">
                          {ci.organisation}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            {ci.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-primary">
                          {new Date(ci.checkedInAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-primary">
                          {ci.checkedInBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-muted">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
