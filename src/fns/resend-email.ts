import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";
import { sendResendTicketEmail } from "@/server/lib/email";

export const resendTicketEmailFn = createServerFn({ method: "POST" })
  .validator((input: { attendeeId: string }) => {
    return { attendeeId: input.attendeeId };
  })
  .handler(async ({ data }) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.attendeeId },
      include: { category: true, ticket: true },
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    if (!attendee.ticket) {
      return { success: false, error: "No ticket issued yet" };
    }

    const ticketUrl = `${process.env.APP_URL}/ticket/${attendee.ticket.qrToken}`;

    try {
      await sendResendTicketEmail({
        to: attendee.email,
        attendeeName: `${attendee.firstName} ${attendee.lastName}`,
        attendeeId: attendee.attendeeId ?? "",
        category: attendee.category.name,
        ticketUrl,
      });
      return { success: true };
    } catch (err) {
      console.error("Failed to resend email:", err);
      return { success: false, error: "Failed to send email" };
    }
  });
