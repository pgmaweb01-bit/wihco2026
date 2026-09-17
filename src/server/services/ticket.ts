import { prisma } from "../lib/prisma";
import crypto from "crypto";

function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("hex").toUpperCase().slice(0, length);
}

export function generateQrToken(): string {
  return crypto.randomUUID();
}

export function generateTicketReference(): string {
  return `WIHCN26-TKT-${generateRandomString(8)}`;
}

export async function createTicket(attendeeId: string): Promise<{ ticketReference: string; qrToken: string }> {
  const ticketReference = generateTicketReference();
  const qrToken = generateQrToken();

  const ticket = await prisma.ticket.create({
    data: {
      attendeeId,
      ticketReference,
      qrToken,
      status: "ISSUED",
      issuedAt: new Date(),
    },
  });

  return { ticketReference: ticket.ticketReference, qrToken: ticket.qrToken };
}

export async function getTicketByToken(qrToken: string) {
  return prisma.ticket.findUnique({
    where: { qrToken },
    include: {
      attendee: {
        include: {
          category: true,
        },
      },
    },
  });
}
