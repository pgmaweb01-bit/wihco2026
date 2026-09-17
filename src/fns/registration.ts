import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { initializePaystackTransaction } from "@/server/lib/paystack";
import { generateAttendeeId } from "@/server/services/attendee-id";
import { createTicket } from "@/server/services/ticket";
import { sendConfirmationEmail } from "@/server/lib/email";
import { randomBytes } from "crypto";

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
        paymentAmount: category.price,
        paymentCurrency: category.currency,
      },
    });

    let authorizationUrl: string | null = null;

    if (category.price && category.price > 0) {
      const paystackResponse = await initializePaystackTransaction({
        amount: category.price,
        email: data.email,
        reference: paymentReference,
        metadata: {
          attendeeId: attendee.id,
          categoryId: data.categoryId,
        },
      });

      authorizationUrl = paystackResponse.data.authorization_url;
    } else {
      // Free registration — issue ticket and send email immediately
      await prisma.attendee.update({
        where: { id: attendee.id },
        data: { paymentStatus: "PAID" },
      });

      const uniqueAttendeeId = await generateAttendeeId(attendee.id);
      await createTicket({ attendeeId: attendee.id, attendeeUniqueId: uniqueAttendeeId });

      const ticket = await prisma.ticket.findUnique({ where: { attendeeId: attendee.id } });
      const ticketUrl = `${process.env.APP_URL}/ticket/${ticket?.qrToken}`;

      try {
        await sendConfirmationEmail({
          to: attendee.email,
          attendeeName: `${attendee.firstName} ${attendee.lastName}`,
          attendeeId: uniqueAttendeeId,
          category: category.name,
          ticketUrl,
        });
        console.log(`Email sent to ${attendee.email}`);
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }
    }

    return {
      success: true,
      attendeeId: attendee.id,
      paymentReference,
      authorizationUrl,
    };
  });
