import { createServerFn } from "@tanstack/react-start";
import { stringify } from "csv-stringify/sync";
import { prisma } from "@/server/lib/prisma";

export const exportAttendeesFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const attendees = await prisma.attendee.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = attendees.map((a) => ({
      "Attendee ID": a.attendeeId,
      "First Name": a.firstName,
      "Last Name": a.lastName,
      Email: a.email,
      Phone: a.phone ?? "",
      Organisation: a.organisation ?? "",
      "Job Title": a.jobTitle ?? "",
      City: a.city ?? "",
      Country: a.country ?? "",
      Category: a.category?.name ?? "",
      "Payment Status": a.paymentStatus,
      "Payment Reference": a.paymentReference ?? "",
      "Payment Amount": a.paymentAmount ?? "",
      "Paid At": a.paidAt ? a.paidAt.toISOString() : "",
      "Ticket Reference": a.ticketReference ?? "",
      "Check-In Status": a.checkedIn ? "Checked In" : "Not Checked In",
      "Check-In Time": a.checkedInAt ? a.checkedInAt.toISOString() : "",
      "Registered At": a.createdAt.toISOString(),
    }));

    const csv = stringify(rows, { header: true });

    return {
      csv,
      filename: `wihcn-con-attendees-${new Date().toISOString().split("T")[0]}.csv`,
    };
  });
