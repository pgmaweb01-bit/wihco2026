import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminAttendeesFn } from "@/fns/admin-attendees";
import { exportAttendeesFn } from "@/fns/admin-export";

export const Route = createFileRoute("/admin/attendees")({
  component: AdminAttendees,
});

type Attendee = {
  id: string;
  attendeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organisation: string;
  jobTitle: string;
  city: string;
  country: string;
  categoryId: string;
  categoryName: string;
  paymentStatus: string;
  paymentReference: string | null;
  paidAt: string | null;
  ticketReference: string | null;
  ticketStatus: string;
  checkInStatus: string;
  checkInTime: string | null;
  createdAt: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

function AdminAttendees() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterCheckIn, setFilterCheckIn] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAttendees = (page = 1, searchVal = search) => {
    setLoading(true);

    const checkInParam = filterCheckIn === "CHECKED_IN"
      ? "checked_in"
      : filterCheckIn === "NOT_CHECKED_IN"
        ? "not_checked_in"
        : undefined;

    getAdminAttendeesFn({
      data: {
        page,
        limit: 20,
        ...(searchVal && { search: searchVal }),
        ...(filterPayment && { paymentStatus: filterPayment }),
        ...(checkInParam && { checkInStatus: checkInParam }),
      },
    })
      .then((res: any) => {
        const raw = res?.attendees ?? [];
        const mapped: Attendee[] = raw.map((a: any) => ({
          id: a.id,
          attendeeId: a.attendeeId,
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          phone: a.phone ?? "",
          organisation: a.organisation ?? "",
          jobTitle: a.jobTitle ?? "",
          city: a.city ?? "",
          country: a.country ?? "",
          categoryId: a.categoryId,
          categoryName: a.category?.name ?? "",
          paymentStatus: a.paymentStatus,
          paymentReference: a.paymentReference ?? null,
          paidAt: a.paidAt ?? null,
          ticketReference: a.ticketReference ?? null,
          ticketStatus: a.ticketStatus ?? "",
          checkInStatus: a.checkInStatus ?? "NOT_CHECKED_IN",
          checkInTime: a.checkInTime ?? null,
          createdAt: a.createdAt,
        }));
        setAttendees(mapped);
        setPagination(res?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendees(1);
  }, [filterPayment, filterCheckIn]);

  const handleSearch = () => {
    fetchAttendees(1, search);
  };

  const handleResend = async (attendeeId: string) => {
    setActionLoading(attendeeId);
    try {
      await fetch(`/api/admin/tickets/${attendeeId}/resend`, { method: "POST" });
      alert("Ticket resent!");
    } catch {
      alert("Failed to resend ticket.");
    }
    setActionLoading(null);
  };

  const handleExport = async () => {
    try {
      const res: any = await exportAttendeesFn({ data: {} });
      const csv = res?.csv ?? "";
      const filename = res?.filename ?? "attendees.csv";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export attendees.");
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-accent/10 text-accent",
      PENDING: "bg-primary/10 text-primary",
      FAILED: "bg-destructive/10 text-destructive",
      CHECKED_IN: "bg-accent/10 text-accent",
      NOT_CHECKED_IN: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Attendees</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">{pagination.total} total</p>
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg bg-primary px-4 py-2 font-body text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="rounded-lg border border-input bg-background px-4 py-2 font-body text-sm outline-none focus:border-accent"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-secondary px-4 py-2 font-body text-xs font-bold text-secondary-foreground"
          >
            Search
          </button>
        </div>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="rounded-lg border border-input bg-background px-4 py-2 font-body text-sm outline-none"
        >
          <option value="">All Payment</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={filterCheckIn}
          onChange={(e) => setFilterCheckIn(e.target.value)}
          className="rounded-lg border border-input bg-background px-4 py-2 font-body text-sm outline-none"
        >
          <option value="">All Check-In</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="NOT_CHECKED_IN">Not Checked In</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full font-body text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Check-In</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : attendees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No attendees found.
                </td>
              </tr>
            ) : (
              attendees.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.attendeeId || "—"}</td>
                  <td className="px-4 py-3">{a.categoryName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(a.paymentStatus)}`}>
                      {a.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(a.checkInStatus)}`}>
                      {a.checkInStatus === "CHECKED_IN" ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.paymentStatus === "PAID" && (
                      <button
                        onClick={() => handleResend(a.id)}
                        disabled={actionLoading === a.id}
                        className="rounded bg-secondary px-2 py-1 text-[10px] font-bold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                      >
                        {actionLoading === a.id ? "..." : "Resend"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchAttendees(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-border px-3 py-1.5 font-body text-xs font-bold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="font-body text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchAttendees(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-border px-3 py-1.5 font-body text-xs font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
