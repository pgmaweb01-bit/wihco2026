import { prisma } from "../lib/prisma";
import { verifyPaystackTransaction } from "../lib/paystack";
import { generateAttendeeId } from "./attendee-id";
import { createTicket } from "./ticket";
import { sendConfirmationEmail } from "../lib/email";
import type { Attendee, PaymentProvider, PaymentRecordStatus, RegistrationCategory } from "@prisma/client";

export type SettlePaidResult = {
  settled: boolean;
  attendeeId?: string;
  reason?: "already_settled" | "not_paid" | "attendee_not_found";
};

export type CompletePaidResult = {
  completed: boolean;
  attendeeId: string;
  attendeeUniqueId: string;
  ticketReference: string;
  qrToken: string;
};

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

  await prisma.payment.create({
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
  const ticket = await createTicket(attendee.id);

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: {
      attendeeId: uniqueAttendeeId,
      paymentStatus: "PAID",
      paymentAmount: params.amount,
      paymentReference: params.reference,
      paidAt,
      ticketReference: ticket.ticketReference,
      ticketStatus: "ISSUED",
    },
  });

  const ticketUrl = `${process.env.APP_URL}/ticket/${ticket.qrToken}`;

  try {
    await sendConfirmationEmail({
      to: attendee.email,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      attendeeId: uniqueAttendeeId,
      ticketUrl,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  return {
    completed: true,
    attendeeId: attendee.id,
    attendeeUniqueId: uniqueAttendeeId,
    ticketReference: ticket.ticketReference,
    qrToken: ticket.qrToken,
  };
}

export async function settlePaidRegistration(params: {
  reference: string;
  email?: string;
}): Promise<SettlePaidResult> {
  const existingPayment = await prisma.payment.findUnique({
    where: { reference: params.reference },
  });

  if (existingPayment) {
    return { settled: true, attendeeId: existingPayment.attendeeId, reason: "already_settled" };
  }

  const verification = await verifyPaystackTransaction(params.reference);

  if (!verification.status || verification.data.status !== "success") {
    return { settled: false, reason: "not_paid" };
  }

  const metadata = verification.data.metadata as { attendeeId?: string } | undefined;
  const metadataAttendeeId = metadata?.attendeeId;

  let attendee: (Attendee & { category: RegistrationCategory }) | null = null;

  if (metadataAttendeeId) {
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
  // so fall back to matching the payer by email.
  if (!attendee && params.email) {
    attendee = await prisma.attendee.findFirst({
      where: { email: { equals: params.email, mode: "insensitive" } },
      include: { category: true },
    });
  }

  if (!attendee) {
    return { settled: false, reason: "attendee_not_found" };
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