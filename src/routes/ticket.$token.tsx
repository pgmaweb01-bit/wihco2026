import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getTicketByTokenFn } from "@/fns/ticket";

export const Route = createFileRoute("/ticket/$token")({
  head: () => ({
    meta: [
      { title: "Your Ticket — WIHCN CON III" },
      {
        name: "description",
        content: "View your WIHCN CON III ticket and QR code.",
      },
    ],
  }),
  component: TicketPage,
});

type TicketData = {
  ticket: { ticketReference: string; status: string; issuedAt: string };
  attendee: {
    firstName: string;
    lastName: string;
    attendeeId: string;
    organisation: string;
    jobTitle: string;
  };
  event: {
    name: string;
    theme: string;
    subtitle: string;
    date: string;
    venue: string;
  };
  qrCode: string;
};

function TicketPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchTicket() {
      try {
        const result = await getTicketByTokenFn({
          data: { qrToken: token },
        });
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError("Invalid or expired ticket.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTicket();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-body text-sm text-muted-foreground">
            Loading your ticket...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data || (data as any).error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-4xl font-extrabold text-foreground">
            Invalid Ticket
          </h1>
          <p className="mt-3 font-body text-sm text-muted-foreground">
            {(data as any)?.error || error || "This ticket could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="badge-print overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="bg-primary px-6 py-8 text-center text-primary-foreground">
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
              {data.event.name}
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              {data.event.theme}
            </h1>
            <p className="mt-1 font-body text-xs opacity-80">
              {data.event.subtitle}
            </p>
            <div className="mx-auto mt-4 h-px w-16 bg-accent" />
            <p className="mt-3 font-body text-sm font-semibold opacity-90">
              {data.event.date}
            </p>
            <p className="mt-1 font-body text-xs opacity-70">
              {data.event.venue}
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-3">
              <div className="border-b border-border pb-3">
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Attendee
                </p>
                <p className="mt-1 font-display text-xl font-extrabold">
                  {data.attendee.firstName} {data.attendee.lastName}
                </p>
                {data.attendee.organisation && (
                  <p className="mt-0.5 font-body text-xs text-muted-foreground">
                    {data.attendee.jobTitle
                      ? `${data.attendee.jobTitle}, `
                      : ""}
                    {data.attendee.organisation}
                  </p>
                )}
              </div>

              <div className="border-b border-border pb-3">
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Attendee ID
                </p>
                <p className="mt-1 font-body text-sm font-bold">
                  {data.attendee.attendeeId}
                </p>
              </div>

              <div className="text-center">
                <img
                  src={data.qrCode}
                  alt="QR Code"
                  className="mx-auto size-48"
                />
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {data.ticket.ticketReference}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="no-print mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-8 py-3 font-body text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:bg-primary/90"
          >
            Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
