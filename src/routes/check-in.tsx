import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { scanTicketFn } from "@/fns/checkin";
import { confirmCheckInFn } from "@/fns/checkin";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [{ title: "Check-In — WIHCN CON III" }],
  }),
  component: CheckInPage,
});

type AttendeeInfo = {
  id: string;
  attendeeId: string;
  firstName: string;
  lastName: string;
  organisation: string;
  jobTitle: string;
  category: string;
};

type CheckInState =
  | "idle"
  | "scanning"
  | "found"
  | "confirming"
  | "success"
  | "already-checked-in"
  | "invalid"
  | "error";

function CheckInPage() {
  const [state, setState] = useState<CheckInState>("idle");
  const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
  const [badgeType, setBadgeType] = useState<"GENERAL" | "SPEAKER" | "PANELIST">("GENERAL");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [currentToken, setCurrentToken] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processToken = async (qrToken: string) => {
    if (!qrToken.trim()) return;

    setState("scanning");
    setCurrentToken(qrToken.trim());

    try {
      const scanData = await scanTicketFn({ data: { qrToken: qrToken.trim() } });

      if (!scanData.valid) {
        setState("invalid");
        setErrorMessage("This ticket could not be verified.");
        return;
      }

      if (scanData.alreadyCheckedIn) {
        setAttendee(scanData.attendee!);
        setCheckInTime(scanData.checkInTime ?? "");
        setState("already-checked-in");
        return;
      }

      setAttendee(scanData.attendee!);
      setState("found");
    } catch {
      setState("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  const confirmCheckIn = async () => {
    if (!attendee) return;
    setState("confirming");

    try {
      const data = await confirmCheckInFn({
        data: {
          qrToken: currentToken,
          checkedInBy: "staff",
          device: navigator.userAgent,
        },
      });

      if (data.success) {
        setBadgeType(data.badgeType ?? "GENERAL");
        setCheckInTime(data.checkInTime ? new Date(data.checkInTime).toLocaleTimeString() : "");
        setState("success");
      } else if (data.alreadyCheckedIn) {
        setCheckInTime(data.checkInTime ? new Date(data.checkInTime).toLocaleTimeString() : "");
        setState("already-checked-in");
      } else {
        setState("error");
        setErrorMessage(data.error || "Check-in failed.");
      }
    } catch {
      setState("error");
      setErrorMessage("Something went wrong.");
    }
  };

  const reset = () => {
    setState("idle");
    setAttendee(null);
    setManualToken("");
    setCurrentToken("");
    setErrorMessage("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const badgeLabel = {
    GENERAL: "Standard Badge",
    SPEAKER: "Banner Badge",
    PANELIST: "Colour-Strip Badge",
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-[#082266] px-6 py-5 text-center text-white shadow-lg">
        <p className="font-display text-xl font-extrabold tracking-tight">
          WIHCN CON III — Check-In
        </p>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Idle / Scan State */}
        {(state === "idle" || state === "scanning") && (
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto mb-4 grid size-28 place-items-center rounded-full border-4 border-dashed border-[#082266]/30 bg-[#082266]/5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-14 text-[#082266]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#082266]">
                Scan QR Code
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Point the camera at the attendee's QR code
              </p>
            </div>

            <div className="mb-8">
              <p className="mb-3 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Or enter token manually
              </p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Paste QR token here"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") processToken(manualToken);
                  }}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-4 font-body text-base outline-none focus:border-[#082266] focus:ring-2 focus:ring-[#082266]/20"
                />
                <button
                  onClick={() => processToken(manualToken)}
                  disabled={!manualToken.trim() || state === "scanning"}
                  className="rounded-lg bg-[#082266] px-8 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {state === "scanning" ? "..." : "Scan"}
                </button>
              </div>
            </div>

            {state === "scanning" && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-[#082266] border-t-transparent" />
                <span className="font-body text-sm">Checking ticket...</span>
              </div>
            )}
          </div>
        )}

        {/* Found — Confirm */}
        {state === "found" && attendee && (
          <div className="text-center">
            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-[#082266]">
                Attendee Found
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">
                {attendee.firstName} {attendee.lastName}
              </h2>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                {attendee.organisation}
              </p>
              <div className="mx-auto mt-4 h-px w-16 bg-border" />
              <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="font-body text-[10px] font-bold uppercase text-muted-foreground">
                    Attendee ID
                  </p>
                  <p className="mt-1 font-body text-sm font-bold">{attendee.attendeeId}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] font-bold uppercase text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 font-body text-sm font-bold">{attendee.category}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-lg border border-border bg-background px-6 py-4 font-body text-base font-bold transition-all hover:bg-secondary active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckIn}
                disabled={state === "confirming"}
                className="flex-1 rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98] disabled:opacity-50"
              >
                {state === "confirming" ? "Checking in..." : "Confirm Check-In"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {state === "success" && attendee && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-green-100">
              <span className="text-4xl text-green-600">&#10003;</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-green-600">
              CHECK-IN SUCCESSFUL
            </h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="font-display text-2xl font-extrabold text-foreground">
                {attendee.firstName} {attendee.lastName}
              </p>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                {attendee.organisation}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="font-body text-[10px] font-bold uppercase text-muted-foreground">
                    Attendee ID
                  </p>
                  <p className="mt-1 font-body text-sm font-bold">{attendee.attendeeId}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] font-bold uppercase text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 font-body text-sm font-bold">{attendee.category}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-body text-xs text-muted-foreground">
                  Checked in at: {checkInTime}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#082266]/20 bg-[#082266]/5 p-4">
              <p className="font-body text-xs font-bold uppercase text-[#082266]">
                Badge: {badgeLabel[badgeType]}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-6 w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
            >
              Print Badge
            </button>

            <button
              onClick={reset}
              className="mt-3 w-full rounded-lg border border-border bg-background px-6 py-4 font-body text-base font-bold transition-all hover:bg-secondary active:scale-[0.98]"
            >
              Scan Next
            </button>
          </div>
        )}

        {/* Already Checked In */}
        {state === "already-checked-in" && attendee && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-amber-100">
              <span className="text-4xl text-amber-600">&#9888;</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-amber-600">
              ALREADY CHECKED IN
            </h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="font-display text-2xl font-extrabold text-foreground">
                {attendee.firstName} {attendee.lastName}
              </p>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                Attendee ID: {attendee.attendeeId}
              </p>
              <p className="mt-3 font-body text-sm text-muted-foreground">
                Checked in at:{" "}
                {checkInTime
                  ? new Date(checkInTime).toLocaleString()
                  : "Previously"}
              </p>
            </div>
            <button
              onClick={reset}
              className="mt-6 w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
            >
              Scan Next
            </button>
          </div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-red-100">
              <span className="text-4xl text-red-600">&#10005;</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-red-600">
              INVALID TICKET
            </h2>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              {errorMessage || "This ticket could not be verified."}
            </p>
            <button
              onClick={reset}
              className="mt-6 w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-red-100">
              <span className="text-4xl text-red-600">!</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-red-600">Error</h2>
            <p className="mt-3 font-body text-sm text-muted-foreground">{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-6 w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
