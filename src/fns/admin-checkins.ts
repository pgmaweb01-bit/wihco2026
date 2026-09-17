import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminCheckInsFn = createServerFn({ method: "POST" })
  .validator((data: { page?: number; limit?: number }) => data)
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const limit = data.limit ?? 20;

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        include: {
          attendee: {
            include: { category: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkedInAt: "desc" },
      }),
      prisma.checkIn.count(),
    ]);

    return {
      checkIns: checkIns.map((c) => ({
        id: c.id,
        attendeeId: c.attendee.attendeeId ?? "",
        name: `${c.attendee.firstName} ${c.attendee.lastName}`,
        email: c.attendee.email,
        organisation: c.attendee.organisation,
        category: c.attendee.category?.name ?? "",
        checkedInAt: c.checkedInAt.toISOString(),
        checkedInBy: c.checkedInBy ?? "staff",
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
