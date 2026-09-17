import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/server/lib/prisma";
import { sendResendTicketEmail } from "@/server/lib/email";

export const Route = createFileRoute("/api/admin/tickets/$attendeeId/resend")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const attendee = await prisma.attendee.findUnique({
            where: { id: params.attendeeId },
            include: { category: true, ticket: true },
          });

          if (!attendee) {
            return new Response(
              JSON.stringify({ error: "Attendee not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!attendee.ticket) {
            return new Response(
              JSON.stringify({ error: "No ticket issued yet" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const ticketUrl = `${process.env.APP_URL}/ticket/${attendee.ticket.qrToken}`;

          await sendResendTicketEmail({
            to: attendee.email,
            attendeeName: `${attendee.firstName} ${attendee.lastName}`,
            attendeeId: attendee.attendeeId ?? "",
            category: attendee.category.name,
            ticketUrl,
          });

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Resend error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to resend" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
  component: () => null,
});
