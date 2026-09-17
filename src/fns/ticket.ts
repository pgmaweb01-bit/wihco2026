import { createServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { prisma } from "@/server/lib/prisma";

export const getTicketByTokenFn = createServerFn({ method: "POST" })
  .validator((input: { qrToken: string }) => {
    return { qrToken: input.qrToken };
  })
  .handler(async ({ data }) => {
    const ticket = await prisma.ticket.findUnique({
      where: { qrToken: data.qrToken },
      include: {
        attendee: {
          include: { category: true },
        },
      },
    });

    if (!ticket) {
      return { error: "Invalid ticket" };
    }

    const qrCode = await QRCode.toDataURL(data.qrToken, {
      width: 300,
      margin: 2,
      color: { dark: "#082266", light: "#ffffff" },
    });

    return {
      ticket: {
        ticketReference: ticket.ticketReference,
        status: ticket.status,
        issuedAt: ticket.issuedAt,
      },
      attendee: {
        firstName: ticket.attendee.firstName,
        lastName: ticket.attendee.lastName,
        attendeeId: ticket.attendee.attendeeId,
        organisation: ticket.attendee.organisation,
        jobTitle: ticket.attendee.jobTitle,
      },
      category: {
        name: ticket.attendee.category.name,
      },
      event: {
        name: "WIHCN CON III",
        theme: "Beyond Leadership",
        subtitle: "Building Legacy & Advancing Innovation",
        date: "Friday, 30 October 2026",
        venue: "Harbour Point, Lagos",
      },
      qrCode,
    };
  });
