import { prisma } from "../lib/prisma";
import { verifyPaystackTransaction } from "../lib/paystack";
import { generateAttendeeId } from "./attendee-id";
import { createTicket } from "./ticket";
import { sendConfirmationEmail } from "../lib/email";
import type { Attendee, PaymentRecordStatus, RegistrationCategory } from "@prisma/client";

export type SettlePaidResult = {
  settled: boolean;
  attendeeId?: string;
  reason?: "already_settled" | "not_paid" | "attendee_not_found";
};

export async function settlePaidRegistration(params: {
  reference: string;
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

  if (!attendee) {
    return { settled: false, reason: "attendee_not_found" };
  }

  const amount = verification.data.amount / 100;
  const paidAt = new Date(verification.data.paid_at);

  await prisma.payment.create({
    data: {
      reference: params.reference,
      amount,
      status: "SUCCESS" as PaymentRecordStatus,
      paidAt,
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
      paymentAmount: amount,
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
      category: attendee.category.name,
      ticketUrl,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  return { settled: true, attendeeId: attendee.id };
}
