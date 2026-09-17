import { createServerFn } from "@tanstack/react-start";
import { getTicketByToken } from "@/server/services/ticket";
import { processCheckIn } from "@/server/services/check-in";

export const scanTicketFn = createServerFn({ method: "POST" })
  .validator((input: { qrToken: string }) => {
    return { qrToken: input.qrToken };
  })
  .handler(async ({ data }) => {
    const ticket = await getTicketByToken(data.qrToken);

    if (!ticket) {
      return { valid: false, error: "INVALID_TICKET" };
    }

    if (ticket.status === "CHECKED_IN") {
      return {
        valid: true,
        alreadyCheckedIn: true,
        attendee: {
          id: ticket.attendee.id,
          attendeeId: ticket.attendee.attendeeId,
          firstName: ticket.attendee.firstName,
          lastName: ticket.attendee.lastName,
          organisation: ticket.attendee.organisation,
          jobTitle: ticket.attendee.jobTitle,
          category: ticket.attendee.category.name,
        },
        checkInTime: ticket.checkedInAt,
      };
    }

    return {
      valid: true,
      alreadyCheckedIn: false,
      attendee: {
        id: ticket.attendee.id,
        attendeeId: ticket.attendee.attendeeId,
        firstName: ticket.attendee.firstName,
        lastName: ticket.attendee.lastName,
        organisation: ticket.attendee.organisation,
        jobTitle: ticket.attendee.jobTitle,
        category: ticket.attendee.category.name,
      },
    };
  });

export const confirmCheckInFn = createServerFn({ method: "POST" })
  .validator(
    (input: { qrToken: string; checkedInBy?: string; device?: string }) => {
      return {
        qrToken: input.qrToken,
        checkedInBy: input.checkedInBy,
        device: input.device,
      };
    },
  )
  .handler(async ({ data }) => {
    try {
      const result = await processCheckIn(data);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_TICKET") {
        return { success: false, error: "INVALID_TICKET" };
      }
      if (
        error instanceof Error &&
        error.message === "ALREADY_CHECKED_IN"
      ) {
        return { success: false, alreadyCheckedIn: true };
      }
      throw error;
    }
  });
