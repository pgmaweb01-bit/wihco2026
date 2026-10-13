import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  requestPasswordResetNeon,
  NeonAuthError,
} from "@/lib/neon-auth";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({
    meta: [{ title: "Reset Password — WIHCN CON III" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("raynovastudio@gmail.com");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`;
      await requestPasswordResetNeon(email.trim(), redirectTo);
      setSent(true);
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
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">Reset Password</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">WIHCN CON III Dashboard</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-body text-sm text-foreground">
              If an account exists for <strong>{email}</strong>, a reset link has
              been sent to that email. It expires in 15 minutes.
            </p>
            <p className="mt-2 font-body text-xs text-muted-foreground">
              Remember to also check your spam folder.
            </p>
            <Link
              to="/admin/login"
              className="mt-6 block rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 font-body text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="mb-4 font-body text-xs text-muted-foreground">
              Enter your admin email and we will send you a password reset link.
            </p>

            <div className="mb-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/admin/login"
                className="font-body text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}