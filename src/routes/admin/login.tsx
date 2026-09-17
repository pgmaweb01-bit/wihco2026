import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adminLoginFn } from "@/fns/admin-auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Login — WIHCN CON III" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@wihcn.org");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await adminLoginFn({ email, password });

      if (!result.success) {
        setError("Login failed");
        setLoading(false);
        return;
      }

      document.cookie = result.cookie;
      navigate({ to: "/admin" });
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/Logo.png" alt="WIHCN" className="mx-auto h-10 w-auto" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">Admin</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">WIHCN CON III Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 font-body text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 font-body text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="mb-6">
            <label className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 font-body text-sm outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
