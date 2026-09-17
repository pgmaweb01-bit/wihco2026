import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/data/conference";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="#home" className="flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="WIHCN"
            className="h-8 w-auto"
          />
          <span className="font-display text-sm font-bold tracking-tight text-primary">
            WIHCN CON <span className="text-muted-foreground">III</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/register"
            className="rounded-lg bg-accent px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Register
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-lg border border-border text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 font-body text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
