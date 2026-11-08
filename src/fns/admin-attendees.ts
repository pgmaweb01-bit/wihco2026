import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";
import { requireAdmin } from "@/server/lib/auth";
import {
  settlePaidRegistration,
  completePaidRegistration,
} from "@/server/services/payment-settlement";
import { listPaystackTransactions } from "@/server/lib/paystack";
import { randomBytes } from "crypto";

export const getAdminAttendeesFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      paymentStatus?: string;
      checkInStatus?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
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
  .validator(
    (data: {
      id: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      organisation?: string;
      jobTitle?: string;
      city?: string;
      country?: string;
      categoryId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
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
    await requireAdmin();
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
  .validator((data: { id: string; paystackReference?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const attendee = await prisma.attendee.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        attendeeId: true,
        email: true,
        paymentStatus: true,
        paymentReference: true,
      },
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    if (attendee.paymentStatus === "PAID") {
      return { success: false, error: "Attendee is already marked as PAID" };
    }

    const settleErrorMessage = (reason?: string) =>
      reason === "not_paid"
        ? "Paystack reports this transaction has not been successfully paid"
        : reason === "amount_mismatch"
          ? "Amount paid on Paystack did not match the expected category fee"
          : reason === "currency_mismatch"
            ? "Payment currency mismatch"
            : "Could not match this registration to a Paystack transaction. Check the reference or use 'Mark Paid'.";

    // 1) Admin-supplied Paystack reference (from the Paystack receipt/dashboard).
    const suppliedRef = data.paystackReference?.trim();
    if (suppliedRef) {
      try {
        const result = await settlePaidRegistration({
          reference: suppliedRef,
          email: attendee.email,
          attendeeId: attendee.id,
          skipAmountCheck: true,
        });
        if (result.settled) {
          return {
            success: true,
            message: "Payment verified and ticket issued — confirmation email queued",
          };
        }
        return { success: false, error: settleErrorMessage(result.reason) };
      } catch {
        return {
          success: false,
          error: "Paystack could not find a transaction with that reference.",
        };
      }
    }

    // 2) Our own reference (API-initialized transactions).
    if (attendee.paymentReference) {
      try {
        const result = await settlePaidRegistration({
          reference: attendee.paymentReference,
          email: attendee.email,
          attendeeId: attendee.id,
          skipAmountCheck: true,
        });
        if (result.settled) {
          return {
            success: true,
            message: "Payment verified and ticket issued — confirmation email queued",
          };
        }
      } catch {
        // Reference not found in Paystack — fall through to email search.
      }
    }

    // 3) The static Paystack Payment Page generates its own reference, so
    //    look up successful transactions by the payer's email.
    try {
      const list = await listPaystackTransactions({
        email: attendee.email,
        status: "success",
        perPage: 50,
      });

      for (const tx of list.data ?? []) {
        if (!tx.reference || tx.status !== "success") continue;
        try {
          const result = await settlePaidRegistration({
            reference: tx.reference,
            email: attendee.email,
            attendeeId: attendee.id,
            skipAmountCheck: true,
          });
          if (result.settled) {
            return {
              success: true,
              message: "Payment found in Paystack and verified — ticket issued",
            };
          }
        } catch {
          // Try the next transaction.
        }
      }
    } catch (err) {
      console.error("Paystack lookup by email failed:", err);
    }

    return {
      success: false,
      error:
        "No successful Paystack transaction found for this attendee's email. Check the Paystack dashboard, enter the reference manually, or use 'Mark Paid'.",
    };
  });

export const syncPaystackPaymentsFn = createServerFn({ method: "POST" })
  .validator((data: { fromDays?: number } | undefined) => ({
    fromDays: Math.min(Math.max(data?.fromDays ?? 60, 1), 365),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const from = new Date(Date.now() - data.fromDays * 24 * 60 * 60 * 1000).toISOString();

    const result = {
      scanned: 0,
      settled: 0,
      alreadySettled: 0,
      unmatched: 0,
      failed: 0,
      errors: [] as { reference: string; email?: string; reason: string }[],
    };

    try {
      // Paystack pages at 100 per request; cap at 10 pages (1,000 transactions).
      for (let page = 1; page <= 10; page++) {
        const list = await listPaystackTransactions({
          status: "success",
          from,
          page,
          perPage: 100,
        });

        if (!list.status || !list.data || list.data.length === 0) break;

        for (const tx of list.data) {
          if (tx.status !== "success" || !tx.reference) continue;
          result.scanned++;

          const existing = await prisma.payment.findUnique({
            where: { reference: tx.reference },
            select: { id: true },
          });
          if (existing) {
            result.alreadySettled++;
            continue;
          }

          const email = tx.customer?.email;
          try {
            const settled = await settlePaidRegistration({
              reference: tx.reference,
              ...(email ? { email } : {}),
              skipAmountCheck: true,
            });

            if (settled.settled) {
              result.settled++;
            } else if (settled.reason === "already_settled") {
              result.alreadySettled++;
            } else {
              result.unmatched++;
              if (result.errors.length < 25) {
                result.errors.push({
                  reference: tx.reference,
                  email,
                  reason: settled.reason ?? "unmatched",
                });
              }
            }
          } catch (err) {
            result.failed++;
            if (result.errors.length < 25) {
              result.errors.push({
                reference: tx.reference,
                email,
                reason: err instanceof Error ? err.message : "error",
              });
            }
          }
        }

        const pageCount = list.meta?.pageCount ?? 1;
        if (page >= pageCount) break;
      }
    } catch (err) {
      console.error("Paystack sync failed:", err);
      return {
        ...result,
        error: err instanceof Error ? err.message : "Paystack sync failed. Check the server logs.",
      };
    }

    return result;
  });

export const markAdminAttendeePaidFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; amount?: number }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
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
      attendee.paymentReference ?? `WIHCN26-MAN-${Date.now()}-${randomBytes(4).toString("hex")}`;

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
