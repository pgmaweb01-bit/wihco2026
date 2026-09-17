import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { SiteFooter } from "@/components/site/site-footer";
import { EVENT } from "@/data/conference";
import { getCategoriesFn } from "@/fns/categories";
import { createRegistrationFn } from "@/fns/registration";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — WIHCN CON III | Beyond Leadership" },
      {
        name: "description",
        content:
          "Register for WIHCN CON III: Beyond Leadership. Friday 30 October 2026, Harbour Point, Lagos. Choose your attendee category and pay securely.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9][0-9\s-]{6,19}$/, "Enter a valid phone number"),
  organisation: z.string().trim().min(1, "Organisation is required").max(150),
  jobTitle: z.string().trim().min(1, "Job title is required").max(150),
  city: z.string().trim().min(1, "City is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100),
  categoryId: z.string().min(1, "Select a registration category"),
});

type Fields = z.input<typeof schema>;

const EMPTY: Fields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organisation: "",
  jobTitle: "",
  city: "",
  country: "Nigeria",
  categoryId: "",
};

const FIELDS: { name: keyof Fields; label: string; type?: string; placeholder?: string }[] = [
  { name: "firstName", label: "First name" },
  { name: "lastName", label: "Last name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone number", type: "tel", placeholder: "+234 800 000 0000" },
  { name: "organisation", label: "Organisation" },
  { name: "jobTitle", label: "Job title" },
  { name: "city", label: "City" },
  { name: "country", label: "Country" },
];

type Category = { id: string; name: string; description: string; price: number | null; currency: string };

function RegisterPage() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "redirect" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getCategoriesFn()
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const selected = categories.find((c) => c.id === values.categoryId) ?? null;

  const set = (name: keyof Fields, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof Fields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    setStep("processing");

    try {
      const result = await createRegistrationFn({ data: parsed.data });

      if (result.authorizationUrl) {
        setStep("redirect");
        window.location.href = result.authorizationUrl;
      } else {
        setStep("processing");
        setErrorMessage("Registration successful! Payment is not required for this category.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setStep("error");
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  if (step === "processing" && !errorMessage) {
    return (
      <div className="min-h-screen bg-background font-body text-foreground">
        <div className="pointer-events-none fixed -top-24 -right-20 size-[520px] rounded-full bg-accent/40 blur-3xl" />
        <div className="pointer-events-none fixed bottom-0 -left-24 size-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-6 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-body text-lg font-semibold text-foreground">Processing registration...</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Connecting to payment gateway</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "redirect") {
    return (
      <div className="min-h-screen bg-background font-body text-foreground">
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-6 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-body text-lg font-semibold text-foreground">Redirecting to payment...</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Please complete your payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="pointer-events-none fixed -top-24 -right-20 size-[520px] rounded-full bg-accent/40 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 -left-24 size-[420px] rounded-full bg-primary/20 blur-3xl" />

      <nav className="sticky top-0 z-50 border-b border-border bg-primary/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Logo.png" alt="WIHCN" className="h-14 w-auto" />
          </Link>
          <Link
            to="/"
            className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
          >
            Back to site
          </Link>
        </div>
      </nav>

      <main className="relative mx-auto max-w-3xl px-6 pt-16 pb-24">
        <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Registration
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9] font-extrabold tracking-tight">
          SECURE
          <br />
          YOUR PLACE
        </h1>
        <p className="mt-5 max-w-[46ch] font-body text-base text-pretty text-muted-foreground">
          {EVENT.theme} — {EVENT.subtitle}. {EVENT.dateLong}, {EVENT.venue}, {EVENT.city}.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-10">
          <div className="rounded-2xl border border-border bg-background/70 p-6 backdrop-blur-xl sm:p-8">
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              Your details
            </span>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.name} className={f.name === "organisation" ? "sm:col-span-2" : ""}>
                  <label
                    htmlFor={f.name}
                    className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    value={values[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    aria-invalid={Boolean(errors[f.name])}
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 font-body text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent aria-invalid:border-destructive"
                  />
                  {errors[f.name] && (
                    <p className="mt-1.5 font-body text-xs text-destructive">{errors[f.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background/70 p-6 backdrop-blur-xl sm:p-8">
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              Registration category
            </span>
            <div className="mt-6 grid gap-3">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition-all ${
                    values.categoryId === c.id
                      ? "border-accent/50 bg-accent/10"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="categoryId"
                    value={c.id}
                    checked={values.categoryId === c.id}
                    onChange={(e) => set("categoryId", e.target.value)}
                    className="mt-1 size-4 accent-[var(--accent)]"
                  />
                  <span className="flex-1">
                    <span className="block font-body text-base font-semibold uppercase tracking-wide">
                      {c.name}
                    </span>
                    <span className="mt-1 block font-body text-sm text-muted-foreground">
                      {c.description}
                    </span>
                  </span>
                  <span className="font-body text-sm font-bold whitespace-nowrap text-foreground">
                    {c.price === null ? "Price TBC" : `${c.currency} ${c.price.toLocaleString()}`}
                  </span>
                </label>
              ))}
            </div>
            {errors.categoryId && (
              <p className="mt-3 font-body text-xs text-destructive">{errors.categoryId}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Amount due
              </span>
              <span className="font-display text-3xl font-extrabold tracking-tight">
                {selected
                  ? selected.price === null
                    ? "TBC"
                    : `${selected.currency} ${selected.price.toLocaleString()}`
                  : "—"}
              </span>
            </div>
          </div>

          {step === "error" && errorMessage && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
              <p className="font-body text-sm font-semibold text-destructive">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-accent px-8 py-4 font-body text-sm font-bold uppercase tracking-[0.14em] text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
          <p className="mt-4 font-body text-xs text-muted-foreground">
            Your place is confirmed only after payment has been verified. Your ticket and QR code are
            then emailed to you.
          </p>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
