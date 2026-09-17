import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminStatsFn } from "@/fns/admin-stats";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stats = {
  totalRegistered: number;
  paid: number;
  pending: number;
  checkedIn: number;
  general: number;
  speakers: number;
  panelists: number;
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStatsFn()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { label: "Total Registered", value: stats?.totalRegistered ?? 0, color: "text-foreground" },
    { label: "Paid", value: stats?.paid ?? 0, color: "text-accent" },
    { label: "Pending", value: stats?.pending ?? 0, color: "text-primary" },
    { label: "Checked In", value: stats?.checkedIn ?? 0, color: "text-accent" },
    { label: "General", value: stats?.general ?? 0, color: "text-foreground" },
    { label: "Speakers", value: stats?.speakers ?? 0, color: "text-foreground" },
    { label: "Panelists", value: stats?.panelists ?? 0, color: "text-foreground" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        WIHCN CON III — Overview
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-2 font-display text-3xl font-extrabold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
