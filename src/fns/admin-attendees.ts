import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";
import {
  settlePaidRegistration,
  completePaidRegistration,
} from "@/server/services/payment-settlement";
import { randomBytes } from "crypto";

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

export const deleteAdminAttendeeFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.id },
      select: { attendeeId: true, email: true },
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    await prisma.attendee.delete({ where: { id: data.id } });

    return {
      success: true,
      message: `Registration ${attendee.attendeeId ?? attendee.email} deleted`,
    };
  });

export const verifyAdminAttendeePaymentFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        attendeeId: true,
        email: true,
        paymentStatus: true,
      },
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    if (attendee.paymentStatus === "PAID") {
      return { success: false, error: "Attendee is already marked as PAID" };
    }

    const pendingAttendee = await prisma.attendee.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        paymentReference: true,
        ticketStatus: true,
      },
    });

    if (!pendingAttendee?.paymentReference) {
      return {
        success: false,
        error: "No payment reference — the Paystack transaction was never initialized for this registration",
      };
    }

    const result = await settlePaidRegistration({
      reference: pendingAttendee.paymentReference,
    });

    if (!result.settled) {
      const message =
        result.reason === "not_paid"
          ? "Paystack reports this transaction has not been paid"
          : "Could not match this registration to a Paystack transaction";
      return { success: false, error: message };
    }

    return {
      success: true,
      message: "Payment verified and ticket issued — confirmation email queued",
    };
  });

export const markAdminAttendeePaidFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; amount?: number }) => data)
  .handler(async ({ data }) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.id },
      include: { category: true, payment: true },
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    if (attendee.paymentStatus === "PAID") {
      return { success: false, error: "Attendee is already marked as PAID" };
    }

    if (!attendee.category) {
      return { success: false, error: "Attendee has an invalid category" };
    }

    const amount = data.amount ?? attendee.paymentAmount ?? 0;
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

    const manualReference =
      attendee.paymentReference ??
      `WIHCN26-MAN-${Date.now()}-${randomBytes(4).toString("hex")}`;

    const result = await completePaidRegistration({
      attendee,
      reference: manualReference,
      amount,
      provider: "MANUAL",
    });

    return {
      success: true,
      message: `${result.attendeeUniqueId} marked PAID — ticket ${result.ticketReference} issued and confirmation email sent`,
    };
  });
