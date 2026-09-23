import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { generateAttendeeId } from "@/server/services/attendee-id";
import { createTicket } from "@/server/services/ticket";
import { sendConfirmationEmail } from "@/server/lib/email";
import { randomBytes } from "crypto";

const REGISTRATION_PRICING: Record<string, number> = {
  virtual: 35000,
  "member-early": 50000,
  "member-late": 60000,
  "nonmember-early": 70000,
  "nonmember-late": 80000,
  "membership-early": 80000,
  "membership-late": 90000,
};

const PAYMENT_PAGE_URL = "https://paystack.shop/pay/wihcniii2026";

function getServerPrice(categoryId: string): number {
  const price = REGISTRATION_PRICING[categoryId];
  if (!price) throw new Error("Invalid registration category");
  return price;
}

function buildPaymentPageUrl(params: {
  email: string;
  firstName: string;
  lastName: string;
}): string {
  const url = new URL(PAYMENT_PAGE_URL);
  url.searchParams.set("email", params.email);
  url.searchParams.set("first_name", params.firstName);
  url.searchParams.set("last_name", params.lastName);
  url.searchParams.set("read-only", "email,first_name,last_name");
  return url.toString();
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

    const authorizationUrl = buildPaymentPageUrl({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return {
      success: true,
      attendeeId: attendee.id,
      paymentReference,
      authorizationUrl,
    };
  });
