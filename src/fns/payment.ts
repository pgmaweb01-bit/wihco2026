import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  validateWebhookSignature,
} from "@/server/lib/paystack";
import { generateAttendeeId } from "@/server/services/attendee-id";
import { createTicket } from "@/server/services/ticket";
import { sendConfirmationEmail } from "@/server/lib/email";

export const initializePaymentFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) =>
    z
      .object({
        attendeeId: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.attendeeId },
      include: { category: true },
    });

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const amount = attendee.paymentAmount ?? attendee.category.price ?? 0;
    if (amount <= 0) {
      return { authorizationUrl: null, reference: null };
    }

    const response = await initializePaystackTransaction({
      amount,
      email: attendee.email,
      reference: attendee.paymentReference ?? `WIHCN26-${attendee.id}-${Date.now()}`,
      metadata: {
        attendeeId: attendee.id,
        categoryId: attendee.categoryId,
      },
    });

    return {
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
    };
  });

export const verifyPaymentFn = createServerFn({
  method: "GET",
})
  .validator((data: unknown) =>
    z
      .object({
        reference: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const payment = await prisma.payment.findUnique({
      where: { reference: data.reference },
    });

    if (!payment) {
      const attendee = await prisma.attendee.findUnique({
        where: { paymentReference: data.reference },
        select: { id: true, paymentStatus: true, ticketStatus: true },
      });

      if (attendee) {
        return {
          status: attendee.paymentStatus,
          attendeeId: attendee.id,
          paymentStatus: attendee.paymentStatus,
          ticketStatus: attendee.ticketStatus,
          hasTicket: attendee.ticketStatus === "ISSUED",
        };
      }

      return {
        status: "not_found",
        reference: data.reference,
        paymentStatus: "PENDING",
        ticketStatus: "PENDING",
        hasTicket: false,
      };
    }

    const attendee = await prisma.attendee.findUnique({
      where: { id: payment.attendeeId },
      select: { id: true, paymentStatus: true, ticketStatus: true },
    });

    return {
      status: payment.status,
      attendeeId: attendee?.id,
      paymentStatus: attendee?.paymentStatus ?? "PENDING",
      ticketStatus: attendee?.ticketStatus ?? "PENDING",
      hasTicket: attendee?.ticketStatus === "ISSUED",
    };
  });

export const processWebhookFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) =>
    z
      .object({
        body: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const isValid = validateWebhookSignature(data.body, data.signature);

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const event = JSON.parse(data.body);

    if (event.event === "charge.success") {
      const { reference, amount, paid_at } = event.data;

      const verificationResponse = await verifyPaystackTransaction(reference);

      if (verificationResponse.status !== "success") {
        throw new Error("Transaction verification failed");
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { reference },
      });

      if (!existingPayment) {
        const metadata = verificationResponse.metadata;
        const attendeeId = metadata.attendeeId;

        await prisma.payment.create({
          data: {
            reference,
            amount: amount / 100,
            status: "SUCCESS",
            paidAt: new Date(paid_at),
            attendeeId,
          },
        });

        await prisma.attendee.update({
          where: { id: attendeeId },
          data: { paymentStatus: "PAID" },
        });

        const uniqueAttendeeId = await generateAttendeeId(attendeeId);

        await createTicket({
          attendeeId,
          attendeeUniqueId: uniqueAttendeeId,
        });

        const attendee = await prisma.attendee.findUnique({
          where: { id: attendeeId },
          include: { category: true, ticket: true },
        });

        if (attendee) {
          const ticketUrl = `${process.env.APP_URL}/ticket/${attendee.ticket?.qrToken}`;
          await sendConfirmationEmail({
            to: attendee.email,
            attendeeName: `${attendee.firstName} ${attendee.lastName}`,
            attendeeId: uniqueAttendeeId,
            category: attendee.category.name,
            ticketUrl,
          });
        }
      }
    }

    return { received: true };
  });
