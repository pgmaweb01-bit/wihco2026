import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { initializePaystackTransaction } from "@/server/lib/paystack";
import { generateAttendeeId } from "@/server/services/attendee-id";
import { createTicket } from "@/server/services/ticket";
import { sendConfirmationEmail } from "@/server/lib/email";
import { randomBytes } from "crypto";

const REGISTRATION_PRICING: Record<string, { early_bird: number; late: number }> = {
  member: { early_bird: 70000, late: 100000 },
  "non-member": { early_bird: 100000, late: 130000 },
  "join-attend": { early_bird: 120000, late: 150000 },
};

function getServerPrice(categoryId: string): number {
  const now = new Date();
  const year = now.getFullYear();
  const earlyStart = new Date(year, 8, 21);
  const earlyEnd = new Date(year, 9, 9, 23, 59, 59);
  const period = now >= earlyStart && now <= earlyEnd ? "early_bird" : "late";
  const pricing = REGISTRATION_PRICING[categoryId];
  if (!pricing) throw new Error("Invalid registration category");
  return pricing[period];
}

const registrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  organisation: z.string().min(1),
  jobTitle: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  categoryId: z.string().min(1),
});

export const createRegistrationFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const category = await prisma.registrationCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new Error("Invalid or inactive registration category");
    }

    const existingAttendee = await prisma.attendee.findUnique({
      where: { email: data.email },
    });

    if (existingAttendee && existingAttendee.paymentStatus === "PAID") {
      throw new Error("A paid registration already exists for this email");
    }

    const amount = getServerPrice(data.categoryId);

    const attendee = await prisma.attendee.upsert({
      where: { email: data.email },
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organisation: data.organisation,
        jobTitle: data.jobTitle,
        city: data.city,
        country: data.country,
        categoryId: data.categoryId,
        paymentStatus: "PENDING",
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        organisation: data.organisation,
        jobTitle: data.jobTitle,
        city: data.city,
        country: data.country,
        categoryId: data.categoryId,
        paymentStatus: "PENDING",
      },
    });

    const randomHex = randomBytes(8).toString("hex");
    const paymentReference = `WIHCN26-${Date.now()}-${randomHex}`;

    await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        paymentReference,
        paymentAmount: amount,
        paymentCurrency: category.currency,
      },
    });

    const paystackResponse = await initializePaystackTransaction({
      amount,
      email: data.email,
      reference: paymentReference,
      metadata: {
        attendeeId: attendee.id,
        categoryId: data.categoryId,
      },
    });

    return {
      success: true,
      attendeeId: attendee.id,
      paymentReference,
      authorizationUrl: paystackResponse.data.authorization_url,
    };
  });
