import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  validateWebhookSignature,
} from "@/server/lib/paystack";
import { getServerPrice, PAYSTACK_CURRENCY, toKobo } from "@/server/lib/pricing";
import { settlePaidRegistration } from "@/server/services/payment-settlement";
import { REGISTRATION_CLOSED, REGISTRATION_CLOSED_MESSAGE } from "@/lib/registration-status";
import { PAYMENT_GATEWAY_ENABLED, PAYMENT_GATEWAY_DISABLED_MESSAGE } from "@/lib/payment-config";

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
    if (REGISTRATION_CLOSED || !PAYMENT_GATEWAY_ENABLED) {
      throw new Error(
        REGISTRATION_CLOSED ? REGISTRATION_CLOSED_MESSAGE : PAYMENT_GATEWAY_DISABLED_MESSAGE,
      );
    }

    const attendee = await prisma.attendee.findUnique({
      where: { id: data.attendeeId },
      include: { category: true },
    });

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    if (attendee.paymentStatus === "PAID") {
      throw new Error("Registration is already paid");
    }

    // Amount always comes from the server pricing table — never from stored
    // client-influenced fields or DB price drift.
    const amount = getServerPrice(attendee.categoryId);
    const currency = attendee.paymentCurrency || PAYSTACK_CURRENCY;

    const reference = attendee.paymentReference ?? `WIHCN26-${attendee.id}-${Date.now()}`;

    const response = await initializePaystackTransaction({
      amount,
      currency,
      email: attendee.email,
      reference,
      metadata: {
        attendeeId: attendee.id,
        categoryId: attendee.categoryId,
        expectedAmountKobo: toKobo(amount),
        currency,
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
        reference: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Gateway disconnected: read our own records only — nothing is requeried
    // from Paystack, so this stays safe to poll from /payment-success.
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
      attendeeId: attendee?.id ?? payment.attendeeId,
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
        body: z.string().min(1).max(1_000_000),
        signature: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!PAYMENT_GATEWAY_ENABLED) {
      throw new Error(PAYMENT_GATEWAY_DISABLED_MESSAGE);
    }

    const isValid = validateWebhookSignature(data.body, data.signature);

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    let event: {
      event?: string;
      data?: { reference?: string; customer?: { email?: string } };
    };
    try {
      event = JSON.parse(data.body);
    } catch {
      throw new Error("Invalid webhook payload");
    }

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (!reference || typeof reference !== "string") {
        throw new Error("Webhook payload missing reference");
      }
      const email = event.data?.customer?.email;

      // Never trust the webhook payload alone — re-verify with Paystack.
      const verificationResponse = await verifyPaystackTransaction(reference);

      if (verificationResponse.status !== true || verificationResponse.data.status !== "success") {
        throw new Error("Transaction verification failed");
      }

      const result = await settlePaidRegistration({
        reference,
        ...(email ? { email } : {}),
      });

      // underpayment / currency mismatch: reject but do not retry forever.
      if (
        !result.settled &&
        (result.reason === "amount_mismatch" || result.reason === "currency_mismatch")
      ) {
        console.error("Webhook settlement refused:", reference, result.reason);
        return { received: true, settled: false, reason: result.reason };
      }

      if (!result.settled && result.reason === "attendee_not_found") {
        console.error("Webhook: no attendee matches reference", reference);
        return { received: true, settled: false, reason: result.reason };
      }

      // not_paid after a successful verify is transient — let Paystack retry.
      if (!result.settled && result.reason === "not_paid") {
        throw new Error("Settlement failed: transaction not paid");
      }
    }

    return { received: true };
  });
