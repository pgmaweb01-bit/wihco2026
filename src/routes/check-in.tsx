import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { scanTicketFn, confirmCheckInFn } from "@/fns/checkin";

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
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerActive) return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await new Promise((r) => setTimeout(r, 100));

      const scannerId = "qr-reader";
      const container = document.getElementById(scannerId);
      if (!container) return;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          processToken(decodedText);
          stopScanner();
        },
        () => {},
      );
      setScannerActive(true);
    } catch (err) {
      console.error("Scanner start failed:", err);
      setScannerActive(false);
    }
  }, [scannerActive, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const processToken = async (qrToken: string) => {
    if (!qrToken.trim()) return;

    setState("scanning");
    setCurrentToken(qrToken.trim());
    await stopScanner();

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

  const reset = async () => {
    setState("idle");
    setAttendee(null);
    setManualToken("");
    setCurrentToken("");
    setErrorMessage("");
    setTimeout(() => {
      if (state === "success" || state === "already-checked-in" || state === "invalid" || state === "error") {
        startScanner();
      } else {
        inputRef.current?.focus();
      }
    }, 100);
  };

  const printBadge = () => {
    window.print();
  };

  const badgeColorMap: Record<string, { bg: string; accent: string; label: string }> = {
    GENERAL: { bg: "#082266", accent: "#082266", label: "GENERAL" },
    SPEAKER: { bg: "#B8860B", accent: "#B8860B", label: "SPEAKER" },
    PANELIST: { bg: "#23A455", accent: "#23A455", label: "PANELIST" },
  };

  const badge = badgeColorMap[badgeType] ?? badgeColorMap.GENERAL;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Screen header — hidden on print */}
      <div className="sticky top-0 z-50 border-b border-border bg-[#082266] px-6 py-5 text-center text-white shadow-lg no-print">
        <p className="font-display text-xl font-extrabold tracking-tight">
          WIHCN CON III — Check-In
        </p>
      </div>

      {/* ============ PRINTABLE BADGE — only visible when printing ============ */}
      {state === "success" && attendee && (
        <div className="print-badge">
          <div
            className="badge-card"
            style={{
              width: "4in",
              height: "6in",
              fontFamily: "Montserrat, Arial, sans-serif",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              color: "#1a1a1a",
              display: "flex",
              flexDirection: "column",
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              pageBreakInside: "avoid",
            }}
          >
            {/* Top colour strip */}
            <div
              style={{
                backgroundColor: badge.accent,
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <img
                src="/Logo.png"
                alt="WIHCN"
                style={{ height: "40px", margin: "0 auto 8px", display: "block", filter: "brightness(0) invert(1)" }}
              />
              <p style={{ color: "#ffffff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
                Women in Healthcare Conference
              </p>
            </div>

            {/* Badge type strip */}
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderBottom: `3px solid ${badge.accent}`,
                padding: "10px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: badge.accent,
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {badge.label}
              </p>
            </div>

            {/* Name & info */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: "0 0 4px 0",
                  color: "#1a1a1a",
                  textTransform: "uppercase",
                }}
              >
                {attendee.firstName}
              </p>
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: "0 0 12px 0",
                  color: "#1a1a1a",
                  textTransform: "uppercase",
                }}
              >
                {attendee.lastName}
              </p>

              {attendee.jobTitle && (
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 2px 0" }}>
                  {attendee.jobTitle}
                </p>
              )}
              {attendee.organisation && (
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "0 0 16px 0" }}>
                  {attendee.organisation}
                </p>
              )}

              <div style={{ width: "60px", height: "1px", backgroundColor: "#d1d5db", margin: "0 0 16px 0" }} />

              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", color: "#9ca3af", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                Attendee ID
              </p>
              <p style={{ fontSize: "14px", fontWeight: 700, fontFamily: "monospace", color: "#374151", margin: 0 }}>
                {attendee.attendeeId}
              </p>
            </div>

            {/* Bottom strip */}
            <div
              style={{
                backgroundColor: badge.accent,
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#ffffff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", margin: 0 }}>
                WIHCN CON III — 30 October 2026 — Harbour Point, Lagos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ SCREEN UI ============ */}
      <div className="mx-auto max-w-lg px-4 py-8 no-print">
        {/* Idle / Scan State */}
        {(state === "idle" || state === "scanning") && (
          <div className="text-center">
            {/* QR Scanner area */}
            <div className="mb-6">
              <div
                id="qr-reader"
                ref={containerRef}
                className="mx-auto overflow-hidden rounded-xl border-2 border-[#082266]/20"
                style={{ maxWidth: "350px", display: scannerActive ? "block" : "none" }}
              />
              {!scannerActive && (
                <div className="mx-auto mb-4 grid size-28 place-items-center rounded-full border-4 border-dashed border-[#082266]/30 bg-[#082266]/5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-14 text-[#082266]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                  </svg>
                </div>
              )}

              <h2 className="font-display text-2xl font-extrabold text-[#082266]">
                {scannerActive ? "Scanning..." : "Scan QR Code"}
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                {scannerActive ? "Hold the QR code in front of the camera" : "Start the camera or enter token manually"}
              </p>
            </div>

            <div className="mb-6 flex flex-col gap-3">
              {!scannerActive ? (
                <button
                  onClick={startScanner}
                  className="w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
                >
                  Start Camera Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="w-full rounded-lg border-2 border-red-500 bg-red-50 px-6 py-4 font-body text-base font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]"
                >
                  Stop Scanner
                </button>
              )}
            </div>

            <div className="mb-8">
              <p className="mb-3 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Or enter token manually
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
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
                  className="w-full rounded-lg bg-[#082266] px-8 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                >
                  {state === "scanning" ? "..." : "Look Up"}
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

            <div className="mt-4 rounded-xl border border-[#082266]/20 bg-[#082266]/5 p-4">
              <p className="font-body text-xs font-bold uppercase text-[#082266]">
                Badge: {badge.label} — Ready to Print
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={printBadge}
                className="w-full rounded-lg bg-[#082266] px-6 py-4 font-body text-base font-bold text-white transition-all hover:bg-[#082266]/90 active:scale-[0.98]"
              >
                Print Conference Badge
              </button>
              <button
                onClick={reset}
                className="w-full rounded-lg border border-border bg-background px-6 py-4 font-body text-base font-bold transition-all hover:bg-secondary active:scale-[0.98]"
              >
                Scan Next
              </button>
            </div>
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
