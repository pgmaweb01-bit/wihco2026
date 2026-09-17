import { CONTACT, EVENT } from "@/data/conference";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="WIHCN" className="h-8 w-auto brightness-0 invert" />
            <span className="font-display text-sm font-bold">{EVENT.name}</span>
          </div>
          <p className="mt-4 font-display text-xl font-bold tracking-tight">{EVENT.theme}</p>
          <p className="mt-1 font-body text-sm opacity-80">{EVENT.subtitle}</p>
          <p className="mt-3 font-body text-sm opacity-80">
            30 October 2026 · {EVENT.venue}, {EVENT.city}
          </p>
          <p className="mt-3 font-body text-sm font-semibold text-accent">
            {EVENT.hashtag}
          </p>
        </div>

        <div>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
            Contact
          </span>
          <ul className="mt-3 space-y-1.5 font-body text-sm">
            <li className="opacity-90">{CONTACT.email}</li>
            <li className="opacity-70">{CONTACT.phone}</li>
            <li className="opacity-70">{CONTACT.website}</li>
          </ul>
        </div>

        <div>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
            Follow
          </span>
          <div className="mt-3 flex flex-wrap gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">
            {CONTACT.socials.map((s) => (
              <a key={s.label} href={s.href} className="transition-opacity hover:opacity-100">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center font-body text-xs opacity-50">
        © 2026 Women in Healthcare Network (WIHCN). All rights reserved.
      </div>
    </footer>
  );
}
