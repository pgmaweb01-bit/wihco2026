import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { verifyPaymentFn } from "@/fns/payment";

export const Route = createFileRoute("/payment-success")({
  head: () => ({
    meta: [{ title: "Payment Status — WIHCN CON III" }],
  }),
  component: PaymentSuccessPage,
});

type VerifyResult = {
  status: string;
  attendeeId?: string;
  paymentStatus: string;
  ticketStatus: string;
  hasTicket: boolean;
};

type PageStatus = "loading" | "success" | "pending" | "error";

function PaymentSuccessPage() {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [message, setMessage] = useState("");
  const [attendeeId, setAttendeeId] = useState("");
  const attemptsRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");

    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data: VerifyResult = await verifyPaymentFn({
          data: { reference },
        });

        if (data.paymentStatus === "PAID") {
          setStatus("success");
          setAttendeeId(data.attendeeId ?? "");
          setMessage("Payment confirmed!");
          return;
        }

        if (data.status === "FAILED") {
          setStatus("error");
          setMessage("Payment was not successful. Please try again.");
          return;
        }
      } catch {
        // continue polling on transient errors
      }

      attemptsRef.current += 1;

      if (attemptsRef.current < 10) {
        timeoutId = setTimeout(poll, 3000);
      } else {
        setStatus("pending");
        setMessage(
          "Your payment is being verified. You will receive an email shortly.",
        );
      }
    };

    poll();

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-6 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Verifying payment...
            </h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-accent/20">
              <span className="text-3xl text-accent">&#10003;</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Payment Confirmed!
            </h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              {message}
            </p>
            {attendeeId && (
              <p className="mt-2 font-body text-xs text-muted-foreground">
                Your attendee ID is{" "}
                <span className="font-semibold text-accent">{attendeeId}</span>.
              </p>
            )}
            <p className="mt-2 font-body text-xs text-muted-foreground">
              Your ticket and QR code have been sent to your email.
            </p>
            <Link
              to="/"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Back to Home
            </Link>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-primary/10">
              <span className="text-3xl text-primary">&#8987;</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Payment Pending
            </h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              {message}
            </p>
            <Link
              to="/"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Back to Home
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-destructive/10">
              <span className="text-3xl text-destructive">&#10005;</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Payment Issue
            </h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              {message}
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-body text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
