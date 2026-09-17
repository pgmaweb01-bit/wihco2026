import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminStatsFn = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const [totalRegistered, paid, pending, checkedIn, general, speakers, panelists] =
      await Promise.all([
        prisma.attendee.count(),
        prisma.attendee.count({ where: { paymentStatus: "PAID" } }),
        prisma.attendee.count({ where: { paymentStatus: "PENDING" } }),
        prisma.ticket.count({ where: { status: "CHECKED_IN" } }),
        prisma.attendee.count({
          where: { category: { name: "General" } },
        }),
        prisma.attendee.count({
          where: { category: { name: "Speakers" } },
        }),
        prisma.attendee.count({
          where: { category: { name: "Panelists" } },
        }),
      ]);

    return {
      totalRegistered,
      paid,
      pending,
      checkedIn,
      general,
      speakers,
      panelists,
    };
  });
