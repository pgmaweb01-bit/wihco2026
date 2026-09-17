import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminAttendeesFn = createServerFn({ method: "POST" })
  .validator((data: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    paymentStatus?: string;
    checkInStatus?: string;
  }) => data)
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const limit = data.limit ?? 20;

    const where: Record<string, unknown> = {};

    if (data.search) {
      where.OR = [
        { firstName: { contains: data.search, mode: "insensitive" } },
        { lastName: { contains: data.search, mode: "insensitive" } },
        { email: { contains: data.search, mode: "insensitive" } },
        { attendeeId: { contains: data.search, mode: "insensitive" } },
        { ticketReference: { contains: data.search, mode: "insensitive" } },
      ];
    }

    if (data.categoryId) {
      where.categoryId = data.categoryId;
    }

    if (data.paymentStatus) {
      where.paymentStatus = data.paymentStatus;
    }

    if (data.checkInStatus) {
      if (data.checkInStatus === "checked_in") {
        where.checkedIn = true;
      } else if (data.checkInStatus === "not_checked_in") {
        where.checkedIn = false;
      }
    }

    const [attendees, total] = await Promise.all([
      prisma.attendee.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendee.count({ where }),
    ]);

    return {
      attendees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

export const updateAdminAttendeeFn = createServerFn({ method: "POST" })
  .validator((data: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    organisation?: string;
    jobTitle?: string;
    city?: string;
    country?: string;
    categoryId?: string;
  }) => data)
  .handler(async ({ data }) => {
    const { id, ...updateData } = data;

    const attendee = await prisma.attendee.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return attendee;
  });
