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
  email: "admin@wihcn.com",
  phone: "+234 916 984 3432",
  website: "wihcn.org",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/womeninhealthcarenetwork/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/women-in-healthcare-network/" },
    { label: "X", href: "https://x.com/wihcnetwork" },
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
  {
    id: "transfer-failed-amount",
    question: 'Why did my bank transfer fail with "incorrect amount sent"?',
    answer:
      'The transfer did not match the exact amount on your payment screen, so the system could not confirm it.\n\nEach bank transfer payment comes with its own account number, and that number accepts only the exact amount shown. If you send a different amount, the payment is declined and the money is returned to your account.\n\nWhat to do:\n1. Make a new payment using the payment link in your registration form. You do not need to register again.\n2. Transfer the exact amount shown on the payment screen, including any charges listed.\n3. Use the new account number. Each account number works for one payment only.\n\nIf the earlier transfer has not been returned within 3 working days, contact your bank with your payment receipt.',
    displayOrder: 9,
  },
  {
    id: "not-completed",
    question: "My payment was not completed. Was I charged?",
    answer:
      'No. If your payment shows as "not completed", "insufficient funds" or "no response", it was not processed and no money was taken.\n\nCommon causes:\n- There was not enough money in the account.\n- The payment page timed out before the payment finished.\n- There was a delay at your bank.\n\nWhat to do:\n1. Check your bank app to confirm no debit took place.\n2. Make a new payment using the payment link in your registration form. You do not need to register again.\n3. If you can, use a card or a different bank account.\n\nIf you were debited, do not pay again. See question 3.',
    displayOrder: 10,
  },
  {
    id: "debited-no-confirmation",
    question: "I was debited but have not received a confirmation. What should I do?",
    answer:
      "Your payment is most likely still being confirmed by your bank. Please do not make a second payment.\n\nBank transfers can take up to 48 hours to confirm. If you have not received a confirmation email by then, send the following to admin@wihcn.com:\n1. Your full name and the email address you registered with.\n2. Your bank receipt or debit alert.\n3. Your Paystack payment reference.\n\nWe will check your payment and confirm your place within 24 hours with your ticket.\n\nStill need help? Contact the WIHCN registration team at admin@wihcn.com — we respond within 24 hours on working days.",
    displayOrder: 11,
  },
];

/**
 * Registration categories and prices — aligned with the Paystack Payment Page
 * (https://paystack.shop/pay/wihcniii2026). Each category is a fixed-price
 * tier; early-bird and late prices are already split per tier on the page.
 */
export type RegistrationCategory = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string;
  active: boolean;
};

export const REGISTRATION_PRICING: Record<string, number> = {
  virtual: 35000,
  "member-early": 50000,
  "member-late": 60000,
  "nonmember-early": 70000,
  "nonmember-late": 80000,
  "membership-early": 80000,
  "membership-late": 90000,
};

export function getPrice(categoryId: string): number | null {
  const price = REGISTRATION_PRICING[categoryId];
  return price ?? null;
}

/**
 * Early-bird / late pricing windows. The registration form only offers the
 * categories for the current window; once the early-bird window ends the late
 * tiers become available automatically.
 */
export const EARLY_BIRD_WINDOW_ENDS = new Date("2026-10-11T23:59:59.999+01:00");

export function getCurrentRegistrationWindow(now: Date = new Date()): "early" | "late" {
  return now <= EARLY_BIRD_WINDOW_ENDS ? "early" : "late";
}

export function isCategoryInCurrentWindow(categoryId: string, period: "early" | "late"): boolean {
  return categoryId === "virtual" || categoryId.endsWith(period === "early" ? "-early" : "-late");
}

export const CATEGORIES: RegistrationCategory[] = [
  { id: "virtual", name: "Virtual Access", description: "Attend the conference virtually.", price: 35000, currency: "NGN", active: true },
  { id: "member-early", name: "Members Early Bird Registration", description: "WIHCN member — early bird rate.", price: 50000, currency: "NGN", active: true },
  { id: "member-late", name: "Members Late Registration", description: "WIHCN member — late rate.", price: 60000, currency: "NGN", active: true },
  { id: "nonmember-early", name: "Non-Members Early Bird Registration", description: "Non-member — early bird rate.", price: 70000, currency: "NGN", active: true },
  { id: "nonmember-late", name: "Non-Members Late Registration", description: "Non-member — late rate.", price: 80000, currency: "NGN", active: true },
  { id: "membership-early", name: "Membership + Early Bird Registration", description: "Become a member and register — early bird rate.", price: 80000, currency: "NGN", active: true },
  { id: "membership-late", name: "Membership + Late Registration", description: "Become a member and register — late rate.", price: 90000, currency: "NGN", active: true },
];

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Theme", href: "#theme" },
  { label: "Programme", href: "#programme" },
  { label: "Venue", href: "#venue" },
  { label: "FAQ", href: "#faq" },
] as const;
