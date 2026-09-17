import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminCheckInsFn = createServerFn({ method: "POST" })
  .validator((data: { page?: number; limit?: number }) => data)
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const limit = data.limit ?? 20;

    const where = { checkedIn: true };

    const [checkIns, total] = await Promise.all([
      prisma.attendee.findMany({
        where,
        select: {
          id: true,
          attendeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          organisation: true,
          category: { select: { name: true } },
          checkedInAt: true,
          checkedInBy: true,
          device: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkedInAt: "desc" },
      }),
      prisma.attendee.count({ where }),
    ]);

    return {
      checkIns: checkIns.map((c) => ({
        ...c,
        category: c.category?.name ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
