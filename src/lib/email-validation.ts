/**
 * Shared email validation helpers used by both the registration form
 * (client) and the registration server function. Pure functions only —
 * no Node/server imports here so this module is safe to bundle for the browser.
 */

/** Throwaway / temporary mail providers that are almost never genuine attendees. */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "grr.la",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "tempmail.net",
  "temp-mail.org",
  "temp-mail.io",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "mytemp.email",
  "tempinbox.com",
  "spamgourmet.com",
  "mohmal.com",
  "emailondeck.com",
  "33mail.com",
  "harakirimail.com",
  "mailcatch.com",
  "tmail.ws",
  "spam4.me",
  "tempr.email",
  "discard.email",
  "wegwerfemail.de",
  "throwaway.email",
  "tempail.com",
  "tempmailo.com",
  "mail-temp.com",
  "burnermail.io",
  "inboxkitten.com",
  "mailsac.com",
]);

/** Well-known providers used for typo detection. */
const COMMON_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
];

/**
 * High-confidence misspellings of popular domains. These are rejected outright
 * with a "did you mean" message because the correct spelling is unambiguous.
 */
const TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmailcom": "gmail.com",
  "gmali.com": "gmail.com",
  "gimail.com": "gmail.com",
  "yahooo.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "icloud.co": "icloud.com",
  "iclod.com": "icloud.com",
  "protonmai.com": "protonmail.com",
  "protonmal.com": "protonmail.com",
};

const EMAIL_REGEX =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function getDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1);
}

export function isDisposableEmail(email: string): boolean {
  const domain = getDomain(normalizeEmail(email));
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  // Also catch subdomains of known disposable providers.
  for (const d of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${d}`)) return true;
  }
  return false;
}

/** Returns a correction for a high-confidence typo, or null. */
export function getTypoCorrection(email: string): string | null {
  const normalized = normalizeEmail(email);
  const domain = getDomain(normalized);
  if (!domain) return null;
  const correctedDomain = TYPO_MAP[domain];
  if (!correctedDomain) return null;
  const local = normalized.slice(0, normalized.lastIndexOf("@"));
  return `${local}@${correctedDomain}`;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Soft suggestion for a near-miss domain (e.g. "gmail.co" typo something not in
 * the explicit map). Returns a full corrected email or null.
 */
export function getEmailSuggestion(email: string): string | null {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at === -1) return null;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!local || !domain) return null;
  if (COMMON_DOMAINS.includes(domain)) return null;

  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of COMMON_DOMAINS) {
    const distance = levenshtein(domain, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  const maxDistance = domain.length >= 10 ? 2 : 1;
  if (best && bestDistance <= maxDistance && bestDistance > 0) {
    return `${local}@${best}`;
  }
  return null;
}

/**
 * Returns a hard validation error message, or null when the email is
 * acceptable. Covers malformed addresses, disposable providers and
 * high-confidence typos.
 */
export function getEmailValidationError(rawEmail: string): string | null {
  const email = normalizeEmail(rawEmail);
  if (!email) return "Email is required";
  if (email.length > 255) return "Email address is too long";
  if (email.includes("..")) return "Enter a valid email address";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address";

  const local = email.slice(0, email.lastIndexOf("@"));
  const domain = getDomain(email);
  if (local.startsWith(".") || local.endsWith(".")) {
    return "Enter a valid email address";
  }
  if (domain.startsWith("-") || domain.endsWith("-") || domain.startsWith(".")) {
    return "Enter a valid email address";
  }

  if (isDisposableEmail(email)) {
    return "Please use a permanent email address — temporary/disposable inboxes are not accepted";
  }

  const typo = getTypoCorrection(email);
  if (typo) {
    return `That domain looks like a typo. Did you mean ${getDomain(typo)}?`;
  }

  return null;
}
