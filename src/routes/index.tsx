import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { EVENT } from "@/data/conference";
import { getSpeakersFn } from "@/fns/speakers";
import { getProgrammeFn } from "@/fns/programme";
import { getFaqsFn } from "@/fns/faqs";
import keynotePortrait from "@/assets/keynote-portrait.jpg";
import venueImage from "@/assets/venue-harbour.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WIHCN CON III — Beyond Leadership | 30 October 2026, Lagos" },
      {
        name: "description",
        content:
          "WIHCN CON III: Beyond Leadership — Building Legacy & Advancing Innovation. Friday 30 October 2026, Harbour Point, Lagos. Register now.",
      },
      { property: "og:title", content: "WIHCN CON III — Beyond Leadership" },
      {
        property: "og:description",
        content:
          "Building Legacy & Advancing Innovation. 30 October 2026, Harbour Point, Lagos. A more inclusive healthcare future is possible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Speaker = { id: string; name: string; title: string; organisation: string; biography: string; imageUrl: string | null; role: string };
type ProgrammeSession = { id: string; title: string; description: string; startTime: string; endTime: string; sessionType: string };
type Faq = { id: string; question: string; answer: string };

const DETAILS = [
  { label: "Date", value: EVENT.dateLong },
  { label: "Time", value: EVENT.time },
  { label: "After Party", value: EVENT.afterParty },
  { label: "Venue", value: `${EVENT.venue}, ${EVENT.city}` },
];

const PILLARS = [
  { n: "01", title: "Connect", body: "Meet the people shaping care across the sector." },
  { n: "02", title: "Inform", body: "Share the practice, evidence and thinking that moves care forward." },
  { n: "03", title: "Inspire", body: "Leave with the conviction and the network to act." },
];

const THEME_IDEAS = [
  { n: "01", title: "Leadership", body: "Practising the judgment that carries a system forward." },
  { n: "02", title: "Legacy", body: "Building the standards the next generation inherits." },
  { n: "03", title: "Innovation", body: "Advancing care with ideas that outlast the trend." },
];

const KEYNOTE_SPEAKER: Speaker = {
  id: "keynote",
  name: "Dr. Omobola Johnson",
  title: "Senior Partner",
  organisation: "TLcom Capital",
  biography: "Biography to be confirmed by the conference team.",
  imageUrl: null,
  role: "KEYNOTE",
};

function Home() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [programme, setProgramme] = useState<ProgrammeSession[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    getSpeakersFn().then(setSpeakers).catch(() => {});
    getProgrammeFn().then(setProgramme).catch(() => {});
    getFaqsFn().then(setFaqs).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen scroll-smooth bg-background font-body text-foreground">
      <SiteNav />

      {/* TICKER */}
      <div className="overflow-hidden border-b border-white/10 bg-primary py-3">
        <div className="flex w-max animate-[marquee_20s_linear_infinite]">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap px-8 font-display text-sm font-bold uppercase tracking-[0.3em] text-white/40">
              Women in Healthcare Network
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <header id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero section immage.jpg"
            alt="WIHCN Conference"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/60" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24">
          <p className="animate-rise mt-8 flex items-baseline gap-3 font-body text-[0.2em] uppercase tracking-[0.2em] text-white/70 [animation-delay:40ms]">
            <span className="font-display text-[clamp(2.5rem,10vw,3.5rem)] font-black leading-none text-accent">3RD</span>
            <span className="font-body text-sm font-bold leading-tight">Annual<br />Conference</span>
          </p>
          <h1 className="animate-rise mt-3 font-display text-[clamp(3.5rem,11vw,9rem)] font-black leading-[0.86] tracking-tight text-white [animation-delay:80ms]">
            BEYOND
            <br />
            LEADERSHIP
          </h1>
          <p className="animate-rise mt-6 max-w-[42ch] font-body text-lg text-pretty text-white/80 [animation-delay:160ms]">
            {EVENT.subtitle} — {EVENT.message.toLowerCase()}
          </p>
          <div className="animate-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link
              to="/register"
              className="rounded-lg bg-accent px-6 py-3 font-body text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
            >
              Register Now
            </Link>
            <a
              href="#programme"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-body text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              View Programme
            </a>
          </div>
          <dl className="animate-rise mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/20 bg-white/10 sm:grid-cols-4 [animation-delay:320ms] backdrop-blur-md">
            {DETAILS.map((d) => (
              <div key={d.label} className="bg-white/10 px-4 py-3 backdrop-blur-md">
                <dt className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                  {d.label}
                </dt>
                <dd className="mt-1 font-body text-sm font-semibold text-white">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between border-b border-border pb-5">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              (a) About
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A day for the people building care</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="max-w-[62ch] font-body text-lg text-pretty text-muted-foreground">
              {EVENT.name} brings together healthcare leaders, clinicians, innovators and partners for a
              single day of collaboration and professional development — a working space for the people
              shaping the future of care.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 sm:p-7">
                  <span className="font-mono text-xs text-accent">{p.n}</span>
                  <h3 className="mt-4 font-display text-3xl font-extrabold tracking-tight uppercase">{p.title}</h3>
                  <p className="mt-3 font-body text-sm text-pretty text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img
              src="/B7K_8176-WIHCN2025-059.jpg"
              alt="WIHCN Conference panel discussion"
              loading="lazy"
              className="aspect-4/3 w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* THEME */}
      <section id="theme" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between border-b border-border pb-5">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">(b) Theme</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{EVENT.theme}</h2>
          </div>
          <p className="hidden max-w-[30ch] text-right font-body text-sm text-muted-foreground sm:block">{EVENT.subtitle}</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {THEME_IDEAS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 sm:p-7">
              <span className="font-mono text-xs text-accent">{t.n}</span>
              <h3 className="mt-4 font-display text-3xl font-extrabold tracking-tight uppercase">{t.title}</h3>
              <p className="mt-3 font-body text-sm text-pretty text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEYNOTE */}
      <section id="speakers" className="border-y border-border bg-background/50">
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-6 py-20 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Keynote Speaker</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{KEYNOTE_SPEAKER.name}</h2>
            <p className="mt-3 font-body text-base font-semibold text-accent">{KEYNOTE_SPEAKER.title}, {KEYNOTE_SPEAKER.organisation}</p>
            <div className="mt-7 rounded-xl border border-border bg-background/70 p-5 backdrop-blur-md">
              <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Biography</span>
              <p className="mt-2 font-body text-sm text-pretty text-muted-foreground">{KEYNOTE_SPEAKER.biography}</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img src={keynotePortrait} alt={`Portrait of ${KEYNOTE_SPEAKER.name}`} width={1024} height={1280} className="h-full max-h-[560px] w-full rounded-2xl object-cover" />
          </div>
        </div>
      </section>

      {/* SPEAKERS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="border-b border-border pb-5">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Speakers &amp; Panelists</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">The voices on stage</h2>
        </div>
        {speakers.length === 0 ? (
          <p className="mt-8 max-w-[48ch] font-body text-sm text-muted-foreground">Speakers and panelists will be announced here as they are confirmed.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((s) => (
              <article key={s.id} className="overflow-hidden rounded-2xl border border-border bg-background/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                <div className="aspect-4/5 w-full bg-accent/15" />
                <div className="p-6">
                  <span className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{s.role}</span>
                  <h3 className="mt-2 font-body text-lg font-semibold">{s.name}</h3>
                  <p className="mt-1 font-body text-sm text-muted-foreground">{s.title}, {s.organisation}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* PROGRAMME */}
      <section id="programme" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between border-b border-border pb-5">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">(c) Programme</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">The day, in order</h2>
        </div>
        <ol className="mt-8">
          {programme.map((s, i) => (
            <li key={s.id} className={`grid grid-cols-[80px_1fr] gap-4 py-7 transition-colors hover:bg-background/60 sm:grid-cols-[150px_1fr] sm:gap-6 ${i < programme.length - 1 ? "border-b border-border" : ""}`}>
              <div>
                <span className="font-mono text-sm font-bold text-foreground">{s.startTime}</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s.endTime}</span>
              </div>
              <div>
                <h3 className="font-body text-lg font-bold text-foreground uppercase">{s.title}</h3>
                <p className="mt-1 font-body text-sm text-muted-foreground">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* GALLERY */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between border-b border-border pb-5">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Past Events
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Moments that matter</h2>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <img src="/Hero section immage.jpg" alt="Conference audience" loading="lazy" className="col-span-2 aspect-16/9 w-full rounded-2xl object-cover md:col-span-1 md:aspect-4/5" />
          <img src="/WIHCN-a-405.jpg" alt="Panel discussion" loading="lazy" className="aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/WIHCN-a-527.jpg" alt="Attendees networking" loading="lazy" className="aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/WIHCN-a-391.jpg" alt="Keynote speaker" loading="lazy" className="aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/WIHCN-a-351.jpg" alt="WIHCN panel" loading="lazy" className="aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/WIHCN-a-227.jpg" alt="Conference attendees" loading="lazy" className="hidden md:block aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/WIHCN-a-149.jpg" alt="Guests at WIHCN" loading="lazy" className="hidden md:block aspect-4/3 w-full rounded-2xl object-cover" />
          <img src="/IMG-20251222-WA0005.jpg" alt="WIHCN launch event" loading="lazy" className="hidden md:block aspect-4/3 w-full rounded-2xl object-cover" />
        </div>
      </section>

      {/* VENUE */}
      <section id="venue" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">(d) Venue</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{EVENT.venue}, {EVENT.city}</h2>
            <p className="mt-4 max-w-[38ch] font-body text-sm text-pretty text-muted-foreground">A waterfront venue for the day's plenary and the evening after party. Full directions will be shared with registered attendees.</p>
            <a href="https://www.google.com/maps/search/?api=1&query=Harbour+Point+Lagos" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-5 py-3 font-body text-sm font-bold text-foreground backdrop-blur-md transition-all hover:border-accent/40 hover:text-accent">Get Directions</a>
          </div>
          <img src={venueImage} alt="Waterfront conference venue in Lagos" loading="lazy" width={1440} height={960} className="aspect-3/2 w-full rounded-2xl object-cover" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between border-b border-border pb-5">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">(e) FAQ</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Before you register</h2>
        </div>
        <div className="mt-8 max-w-3xl">
          {faqs.map((f) => (
            <details key={f.id} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-body text-base font-semibold text-foreground">
                {f.question}
                <span className="font-mono text-lg text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 font-body text-sm text-pretty text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="pointer-events-none absolute inset-0 bg-accent/10" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-[480px] rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-black leading-[0.92] tracking-tight text-foreground">
            Ready to connect,<br />inform &amp; inspire?
          </h2>
          <p className="mx-auto mt-5 max-w-[40ch] font-body text-base text-muted-foreground">
            Join us at {EVENT.name} — {EVENT.theme}, {EVENT.subtitle}. 30 October 2026, {EVENT.venue}, {EVENT.city}.
          </p>
          <Link to="/register" className="mt-8 inline-block rounded-lg bg-accent px-8 py-4 font-body text-sm font-bold uppercase tracking-[0.14em] text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25">
            Register Now
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
