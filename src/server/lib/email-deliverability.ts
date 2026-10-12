import { promises as dns } from "node:dns";

function isDefinitiveMissingRecord(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return (
    code === "ENOTFOUND" ||
    code === "ENODATA" ||
    code === "NXDOMAIN" ||
    code === "ESERVFAIL_MISSING"
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), ms)
    ),
  ]);
}

/**
 * Best-effort deliverability check: confirms the email domain publishes either
 * MX records (mail servers) or an A/AAAA record (implicit mail fallback).
 *
 * Deliberately fails OPEN — any transient DNS problem (timeout, SERVFAIL,
 * network error) returns true so we never block a genuine attendee. Only a
 * definitive "no such domain / no records" result returns false.
 */
export async function isEmailDomainDeliverable(email: string): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (!domain || !domain.includes(".")) return false;

  let mxDefinitiveMiss = false;
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 3000);
    if (mx && mx.length > 0) return true;
    mxDefinitiveMiss = true;
  } catch (err) {
    if (!isDefinitiveMissingRecord(err)) return true; // transient → fail open
    mxDefinitiveMiss = true;
  }

  // Some domains accept mail on their A record without publishing MX.
  let addressDefinitiveMiss = false;
  try {
    const records = await withTimeout(dns.resolve(domain), 3000);
    if (records && records.length > 0) return true;
    addressDefinitiveMiss = true;
  } catch (err) {
    if (!isDefinitiveMissingRecord(err)) return true; // transient → fail open
    addressDefinitiveMiss = true;
  }

  return !(mxDefinitiveMiss && addressDefinitiveMiss);
}
