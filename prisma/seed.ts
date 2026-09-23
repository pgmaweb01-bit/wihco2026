import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Admin User ──────────────────────────────────────
  const passwordHash = await bcrypt.hash("ADMIN1234", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@wihcn.org" },
    update: {},
    create: {
      email: "admin@wihcn.org",
      passwordHash,
      role: "admin",
    },
  });
  console.log("✓ Admin user created (admin@wihcn.org)");

  // ─── Registration Categories ─────────────────────────
  const categories = [
    { id: "virtual", name: "Virtual Access", description: "Attend the conference virtually.", price: 35000, currency: "NGN", active: true },
    { id: "member-early", name: "Members Early Bird Registration", description: "WIHCN member — early bird rate.", price: 50000, currency: "NGN", active: true },
    { id: "member-late", name: "Members Late Registration", description: "WIHCN member — late rate.", price: 60000, currency: "NGN", active: true },
    { id: "nonmember-early", name: "Non-Members Early Bird Registration", description: "Non-member — early bird rate.", price: 70000, currency: "NGN", active: true },
    { id: "nonmember-late", name: "Non-Members Late Registration", description: "Non-member — late rate.", price: 80000, currency: "NGN", active: true },
    { id: "membership-early", name: "Membership + Early Bird Registration", description: "Become a member and register — early bird rate.", price: 80000, currency: "NGN", active: true },
    { id: "membership-late", name: "Membership + Late Registration", description: "Become a member and register — late rate.", price: 90000, currency: "NGN", active: true },
  ];

  for (const cat of categories) {
    await prisma.registrationCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, price: cat.price, active: cat.active },
      create: cat,
    });
  }

  // Legacy tiers are replaced by the Paystack-page-aligned categories above.
  for (const legacyId of ["member", "non-member", "join-attend"]) {
    const legacy = await prisma.registrationCategory.findUnique({ where: { id: legacyId } });
    if (legacy) {
      await prisma.registrationCategory.update({
        where: { id: legacyId },
        data: { active: false },
      });
    }
  }
  console.log("✓ Registration categories created");

  // ─── Keynote Speaker ─────────────────────────────────
  await prisma.speaker.upsert({
    where: { id: "keynote-omobola" },
    update: {},
    create: {
      id: "keynote-omobola",
      name: "Dr. Omobola Johnson",
      title: "Senior Partner",
      organisation: "TLcom Capital",
      biography: "Biography to be confirmed by the conference team.",
      imageUrl: null,
      role: "KEYNOTE",
      displayOrder: 0,
      active: true,
    },
  });
  console.log("✓ Keynote speaker created");

  // ─── Programme Sessions ──────────────────────────────
  await prisma.programmeSession.upsert({
    where: { id: "conference-main" },
    update: {},
    create: {
      id: "conference-main",
      title: "Conference",
      description:
        "Full conference programme to be published by the organising team.",
      startTime: "8:30 a.m.",
      endTime: "5:30 p.m.",
      sessionType: "CONFERENCE",
      displayOrder: 1,
      active: true,
    },
  });

  await prisma.programmeSession.upsert({
    where: { id: "after-party" },
    update: {},
    create: {
      id: "after-party",
      title: "After Party",
      description: "Networking and celebration to close the day.",
      startTime: "6:00 p.m.",
      endTime: "9:00 p.m.",
      sessionType: "AFTER_PARTY",
      displayOrder: 2,
      active: true,
    },
  });
  console.log("✓ Programme sessions created");

  // ─── FAQs ────────────────────────────────────────────
  const faqs = [
    {
      question: "Who can attend?",
      answer:
        "WIHCN CON III is open to healthcare professionals, leaders, innovators and partners who register for one of the published attendee categories.",
      displayOrder: 1,
    },
    {
      question: "How do I register?",
      answer:
        "Complete the registration form, choose your attendee category, and continue to payment. Your place is confirmed once payment is verified.",
      displayOrder: 2,
    },
    {
      question: "How do I pay?",
      answer:
        "Payment is made securely online with Paystack at the end of the registration form.",
      displayOrder: 3,
    },
    {
      question: "When will I receive my ticket?",
      answer:
        "Your ticket is issued as soon as your payment has been verified, and is sent to the email address on your registration.",
      displayOrder: 4,
    },
    {
      question: "How do I access my QR code?",
      answer:
        "Your confirmation email includes your QR ticket and a secure link to view it on your phone at any time.",
      displayOrder: 5,
    },
    {
      question: "What happens when I arrive?",
      answer:
        "Show your QR code at the check-in desk. Our team scans it, checks you in, and prints your badge.",
      displayOrder: 6,
    },
    {
      question: "What happens if I lose my ticket?",
      answer:
        "Contact the organising team using the details in the footer and your ticket can be resent to your registered email address.",
      displayOrder: 7,
    },
    {
      question: "Can I transfer my ticket?",
      answer:
        "Transfer requests are handled case by case by the organising team. Please get in touch before the event date.",
      displayOrder: 8,
    },
  ];

  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { id: `faq-${faq.displayOrder}` },
      update: {},
      create: {
        id: `faq-${faq.displayOrder}`,
        ...faq,
        active: true,
      },
    });
  }
  console.log("✓ FAQs created");

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
