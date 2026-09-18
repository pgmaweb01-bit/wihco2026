/**
 * Conference content.
 *
 * NOTE: these arrays are temporary front-end placeholders for the shapes that
 * will later be served from the database (speakers, programme_sessions, faqs,
 * registration_categories). Nothing here is invented event information: the
 * seeded rows below are clearly marked as awaiting confirmation.
 */

export const EVENT = {
  name: "WIHCN CON III",
  edition: "3rd Annual Conference",
  theme: "Beyond Leadership",
  subtitle: "Building Legacy & Advancing Innovation",
  message: "A more inclusive healthcare future is possible.",
  dateLong: "Friday, 30 October 2026",
  dateShort: "30 Oct 2026",
  time: "8:30 a.m. – 5:30 p.m.",
  afterParty: "6:00 p.m. – 9:00 p.m.",
  venue: "Harbour Point",
  city: "Lagos",
  hashtag: "#WIHCNCON3",
} as const;

export const CONTACT = {
  email: "info@wihcn.org",
  phone: "+234 916 984 3432",
  website: "wihcn.org",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/womeninhealthcarenetwork/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/101134347/" },
    { label: "X", href: "https://twitter.com/wihcnetwork" },
    { label: "YouTube", href: "https://www.youtube.com/@WomenInHealthcareNetwork-WIHCN" },
  ],
} as const;

export type SpeakerRole = "KEYNOTE" | "SPEAKER" | "PANELIST";

export type Speaker = {
  id: string;
  name: string;
  title: string;
  organisation: string;
  biography: string;
  imageUrl: string | null;
  role: SpeakerRole;
  displayOrder: number;
  active: boolean;
};

export const KEYNOTE: Speaker = {
  id: "keynote",
  name: "Dr. Omobola Johnson",
  title: "Senior Partner",
  organisation: "TLcom Capital",
  biography: "Biography to be confirmed by the conference team.",
  imageUrl: null,
  role: "KEYNOTE",
  displayOrder: 0,
  active: true,
};

export const SPEAKERS: Speaker[] = [];

export type ProgrammeSession = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  displayOrder: number;
  active: boolean;
};

export const PROGRAMME: ProgrammeSession[] = [
  {
    id: "conference",
    title: "Conference",
    description: "Full conference programme to be published by the organising team.",
    startTime: "8:30 a.m.",
    endTime: "5:30 p.m.",
    sessionType: "CONFERENCE",
    displayOrder: 1,
    active: true,
  },
  {
    id: "after-party",
    title: "After Party",
    description: "Networking and celebration to close the day.",
    startTime: "6:00 p.m.",
    endTime: "9:00 p.m.",
    sessionType: "AFTER_PARTY",
    displayOrder: 2,
    active: true,
  },
];

export type Faq = { id: string; question: string; answer: string; displayOrder: number };

export const FAQS: Faq[] = [
  {
    id: "who",
    question: "Who can attend?",
    answer:
      "WIHCN CON III is open to healthcare professionals, leaders, innovators and partners who register for one of the published attendee categories.",
    displayOrder: 1,
  },
  {
    id: "register",
    question: "How do I register?",
    answer:
      "Complete the registration form, choose your attendee category, and continue to payment. Your place is confirmed once payment is verified.",
    displayOrder: 2,
  },
  {
    id: "pay",
    question: "How do I pay?",
    answer:
      "Payment is made securely online with Paystack at the end of the registration form.",
    displayOrder: 3,
  },
  {
    id: "ticket",
    question: "When will I receive my ticket?",
    answer:
      "Your ticket is issued as soon as your payment has been verified, and is sent to the email address on your registration.",
    displayOrder: 4,
  },
  {
    id: "qr",
    question: "How do I access my QR code?",
    answer:
      "Your confirmation email includes your QR ticket and a secure link to view it on your phone at any time.",
    displayOrder: 5,
  },
  {
    id: "arrive",
    question: "What happens when I arrive?",
    answer:
      "Show your QR code at the check-in desk. Our team scans it, checks you in, and prints your badge.",
    displayOrder: 6,
  },
  {
    id: "lost",
    question: "What happens if I lose my ticket?",
    answer:
      "Contact the organising team using the details in the footer and your ticket can be resent to your registered email address.",
    displayOrder: 7,
  },
  {
    id: "transfer",
    question: "Can I transfer my ticket?",
    answer:
      "Transfer requests are handled case by case by the organising team. Please get in touch before the event date.",
    displayOrder: 8,
  },
];

/**
 * Placeholder only — categories and prices will be loaded from the database.
 */
export type RegistrationCategory = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string;
  active: boolean;
};

export const REGISTRATION_PRICING: Record<string, { early_bird: number; late: number }> = {
  member: { early_bird: 70000, late: 100000 },
  "non-member": { early_bird: 100000, late: 130000 },
  "join-attend": { early_bird: 120000, late: 150000 },
};

export function getRegistrationPeriod(): { key: "early_bird" | "late"; label: string; dates: string } {
  const now = new Date();
  const year = now.getFullYear();
  const earlyStart = new Date(year, 8, 21);
  const earlyEnd = new Date(year, 9, 9, 23, 59, 59);

  if (now >= earlyStart && now <= earlyEnd) {
    return { key: "early_bird", label: "Early Bird", dates: "21 Sep – 9 Oct" };
  }
  return { key: "late", label: "Late Registration", dates: "12 – 28 Oct" };
}

export function getPrice(categoryId: string): number | null {
  const period = getRegistrationPeriod();
  const pricing = REGISTRATION_PRICING[categoryId];
  if (!pricing) return null;
  return pricing[period.key];
}

export const CATEGORIES: RegistrationCategory[] = [];

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Theme", href: "#theme" },
  { label: "Programme", href: "#programme" },
  { label: "Venue", href: "#venue" },
  { label: "FAQ", href: "#faq" },
] as const;
