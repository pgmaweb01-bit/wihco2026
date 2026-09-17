import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/data/conference";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-primary/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="#home" className="flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="WIHCN"
            className="h-12 w-auto"
          />
        </a>

        <div className="hidden items-center gap-8 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-white">
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
            className="grid size-10 place-items-center rounded-lg border border-white/30 text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/20 bg-primary px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 font-body text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
