import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  completePasswordResetNeon,
  NeonAuthError,
} from "@/lib/neon-auth";

export const Route = createFileRoute("/admin/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string" && search.token.length > 0
        ? search.token
        : "",
    email:
      typeof search.email === "string" && search.email.length > 0
        ? search.email
        : "",
  }),
  head: () => ({
    meta: [{ title: "Set New Password — WIHCN CON III" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, email } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const noToken = token.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await completePasswordResetNeon({
        email,
        token,
        newPassword: password,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof NeonAuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/Logo.png" alt="WIHCN" className="mx-auto h-10 w-auto" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">Set New Password</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">WIHCN CON III Dashboard</p>
        </div>

        {noToken ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-body text-sm text-foreground">
              This reset link is invalid or has expired.
            </p>
            <Link
              to="/admin/forgot-password"
              className="mt-6 block rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Request a New Link
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-body text-sm text-foreground">
              Your password has been reset.
            </p>
            <button
              onClick={() => navigate({ to: "/admin/login" })}
              className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 font-body text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                New Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 font-body text-sm outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 font-body text-sm outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}