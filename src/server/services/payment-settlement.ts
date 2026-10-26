import { prisma } from "../lib/prisma";
import { verifyPaystackTransaction } from "../lib/paystack";
import { getServerPrice, isAmountMatch, isCurrencyMatch, PAYSTACK_CURRENCY } from "../lib/pricing";
import { generateAttendeeId } from "./attendee-id";
import { generateQrToken, generateTicketReference } from "./ticket";
import { sendConfirmationEmail } from "../lib/email";
import type {
  Attendee,
  PaymentProvider,
  PaymentRecordStatus,
  RegistrationCategory,
} from "@prisma/client";

export type SettlePaidResult = {
  settled: boolean;
  attendeeId?: string;
  reason?:
    "already_settled" | "not_paid" | "attendee_not_found" | "amount_mismatch" | "currency_mismatch";
};

export type CompletePaidResult = {
  completed: boolean;
  attendeeId: string;
  attendeeUniqueId: string;
  ticketReference: string;
  qrToken: string;
};

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

export async function completePaidRegistration(params: {
  attendee: Attendee & { category: RegistrationCategory };
  reference: string;
  amount: number;
  paidAt?: Date;
  provider?: PaymentProvider;
}): Promise<CompletePaidResult> {
  const attendee = params.attendee;
  const paidAt = params.paidAt ?? new Date();
  const provider: PaymentProvider = params.provider ?? "PAYSTACK";

  if (params.amount <= 0) {
    throw new Error("Cannot complete registration with a non-positive amount");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Idempotency: a concurrent settle for the same reference loses here.
      const existing = await tx.payment.findUnique({
        where: { reference: params.reference },
      });
      if (existing) {
        throw Object.assign(new Error("Payment already recorded"), {
          code: "P2002",
        });
      }

      await tx.payment.create({
        data: {
          reference: params.reference,
          amount: params.amount,
          status: "SUCCESS" as PaymentRecordStatus,
          paidAt,
          provider,
          attendeeId: attendee.id,
        },
      });

      const uniqueAttendeeId = await generateAttendeeId();
      const ticketReference = generateTicketReference();
      const qrToken = generateQrToken();

      await tx.ticket.create({
        data: {
          attendeeId: attendee.id,
          ticketReference,
          qrToken,
          status: "ISSUED",
          issuedAt: paidAt,
        },
      });

      await tx.attendee.update({
        where: { id: attendee.id },
        data: {
          attendeeId: uniqueAttendeeId,
          paymentStatus: "PAID",
          paymentAmount: params.amount,
          paymentReference: params.reference,
          paidAt,
          ticketReference,
          ticketStatus: "ISSUED",
        },
      });

      return {
        completed: true,
        attendeeId: attendee.id,
        attendeeUniqueId: uniqueAttendeeId,
        ticketReference,
        qrToken,
      };
    });
  } catch (err) {
    // Unique-constraint race (double webhook / concurrent admin action):
    // the first writer won — report success with the existing ticket.
    if (isUniqueViolation(err)) {
      const existing = await prisma.payment.findUnique({
        where: { reference: params.reference },
        include: { attendee: { include: { ticket: true } } },
      });
      if (existing) {
        return {
          completed: true,
          attendeeId: existing.attendeeId,
          attendeeUniqueId: existing.attendee.attendeeId ?? "",
          ticketReference:
            existing.attendee.ticket?.ticketReference ?? existing.attendee.ticketReference ?? "",
          qrToken: existing.attendee.ticket?.qrToken ?? "",
        };
      }
    }
    throw err;
  }
}

export async function settlePaidRegistration(params: {
  reference: string;
  email?: string;
  attendeeId?: string;
  bypassAmountCheck?: boolean;
}): Promise<SettlePaidResult> {
  const existingPayment = await prisma.payment.findUnique({
    where: { reference: params.reference },
  });

  if (existingPayment) {
    return {
      settled: true,
      attendeeId: existingPayment.attendeeId,
      reason: "already_settled",
    };
  }

  const verification = await verifyPaystackTransaction(params.reference);

  if (!verification.status || verification.data.status !== "success") {
    return { settled: false, reason: "not_paid" };
  }

  const metadata = verification.data.metadata as { attendeeId?: string } | undefined;
  const metadataAttendeeId = metadata?.attendeeId;

  let attendee: (Attendee & { category: RegistrationCategory }) | null = null;

  if (params.attendeeId) {
    attendee = await prisma.attendee.findUnique({
      where: { id: params.attendeeId },
      include: { category: true },
    });
  }

  if (!attendee && metadataAttendeeId) {
    attendee = await prisma.attendee.findUnique({
      where: { id: metadataAttendeeId },
      include: { category: true },
    });
  }

  if (!attendee) {
    attendee = await prisma.attendee.findUnique({
      where: { paymentReference: params.reference },
      include: { category: true },
    });
  }

  // Static Payment Page transactions use Paystack's own generated reference,
  // so fall back to matching the payer by email — checking both caller-supplied
  // email and the customer email recorded by Paystack.
  const lookupEmail = params.email || verification.data.customer?.email;
  if (!attendee && lookupEmail) {
    attendee = await prisma.attendee.findFirst({
      where: {
        email: { equals: lookupEmail, mode: "insensitive" },
        paymentStatus: { not: "PAID" },
      },
      include: { category: true },
    });
  }

  if (!attendee) {
    return { settled: false, reason: "attendee_not_found" };
  }

  // Server-side settlement guards: the paid amount and currency must match
  // what this attendee is supposed to pay. Paystack amounts are kobo.
  const expectedNaira = attendee.paymentAmount ?? getServerPrice(attendee.categoryId);

  if (!isCurrencyMatch(verification.data.currency, attendee.paymentCurrency)) {
    console.error(
      "Settlement rejected (currency_mismatch):",
      params.reference,
      "paid",
      verification.data.currency,
      "expected",
      attendee.paymentCurrency || PAYSTACK_CURRENCY,
    );
    return { settled: false, attendeeId: attendee.id, reason: "currency_mismatch" };
  }

  if (!params.bypassAmountCheck && !isAmountMatch(verification.data.amount, expectedNaira)) {
    console.error(
      "Settlement rejected (amount_mismatch):",
      params.reference,
      "paid kobo",
      verification.data.amount,
      "expected kobo",
      Math.round(expectedNaira * 100),
    );
    return { settled: false, attendeeId: attendee.id, reason: "amount_mismatch" };
  }

  const amount = verification.data.amount / 100;
  const paidAt = new Date(verification.data.paid_at);

  await completePaidRegistration({
    attendee,
    reference: params.reference,
    amount,
    paidAt,
    provider: "PAYSTACK",
  });

  return { settled: true, attendeeId: attendee.id };
}
