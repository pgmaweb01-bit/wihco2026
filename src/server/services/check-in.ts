import { prisma } from "../lib/prisma";
import { getTicketToken } from "./ticket";

export interface CheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  invalidTicket?: boolean;
  attendee?: {
    id: string;
    attendeeId: string;
    firstName: string;
    lastName: string;
    organisation: string;
    jobTitle: string;
    category: string;
  };
  checkInTime?: Date;
  badgeType?: "GENERAL" | "SPEAKER" | "PANELIST";
}

export async function processCheckIn(
  qrToken: string,
  checkedInBy?: string,
  device?: string
): Promise<CheckInResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: getTicketToken(qrToken) },
    include: {
      attendee: {
        include: { category: true },
      },
    },
  });

  if (!ticket || !ticket.attendee) {
    return { success: false, invalidTicket: true };
  }

  if (ticket.attendee.checkInStatus === "CHECKED_IN") {
    return {
      success: false,
      alreadyCheckedIn: true,
      checkInTime: ticket.attendee.checkInTime ?? undefined,
      attendee: {
        id: ticket.attendee.id,
        attendeeId: ticket.attendee.attendeeId ?? "",
        firstName: ticket.attendee.firstName,
        lastName: ticket.attendee.lastName,
        organisation: ticket.attendee.organisation,
        jobTitle: ticket.attendee.jobTitle,
        category: ticket.attendee.category.name,
      },
    };
  }

  const now = new Date();

  await prisma.checkIn.create({
    data: {
      attendeeId: ticket.attendee.id,
      checkedInAt: now,
      checkedInBy: checkedInBy ?? "staff",
      device: device ?? "unknown",
    },
  });

  await prisma.attendee.update({
    where: { id: ticket.attendee.id },
    data: {
      checkInStatus: "CHECKED_IN",
      checkInTime: now,
    },
  });

  const categoryName = ticket.attendee.category.name.toUpperCase();
  let badgeType: "GENERAL" | "SPEAKER" | "PANELIST" = "GENERAL";
  if (categoryName === "SPEAKER" || categoryName === "KEYNOTE") {
    badgeType = "SPEAKER";
  } else if (categoryName === "PANELIST") {
    badgeType = "PANELIST";
  }

  return {
    success: true,
    checkInTime: now,
    badgeType,
    attendee: {
      id: ticket.attendee.id,
      attendeeId: ticket.attendee.attendeeId ?? "",
      firstName: ticket.attendee.firstName,
      lastName: ticket.attendee.lastName,
      organisation: ticket.attendee.organisation,
      jobTitle: ticket.attendee.jobTitle,
      category: ticket.attendee.category.name,
    },
  };
}
