import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — WIHCN CON III" }],
  }),
  component: AdminLayout,
});

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Attendees", href: "/admin/attendees" },
  { label: "QR Scanner", href: "/check-in", external: true },
  { label: "Check-In Logs", href: "/admin/check-ins" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Speakers", href: "/admin/speakers" },
  { label: "Programme", href: "/admin/programme" },
  { label: "FAQs", href: "/admin/faqs" },
];

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <img src="/Logo.png" alt="WIHCN" className="h-7 w-auto" />
          <span className="font-display text-sm font-bold">Admin</span>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
                <span className="text-[10px] text-accent">&#8599;</span>
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                activeProps={{ className: "bg-accent/10 text-accent font-bold" }}
                className="block rounded-lg px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          <a
            href="/"
            target="_blank"
            className="block rounded-lg px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2.5 text-left font-body text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/75 px-6 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-border lg:hidden"
          >
            <span className="text-lg">☰</span>
          </button>
          <h2 className="font-display text-sm font-bold text-foreground">WIHCN CON III Dashboard</h2>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
