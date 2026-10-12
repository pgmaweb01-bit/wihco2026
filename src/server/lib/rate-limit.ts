const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function record(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

function isLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= ATTEMPT_LIMIT;
}

function reset(key: string): void {
  attempts.delete(key);
}

export function getLoginRateLimitStatus(
  ip: string,
  email: string
): { limited: boolean } {
  return { limited: isLimited(`${ip}:${email}`) || isLimited(ip) };
}

export function recordLoginFailure(ip: string, email: string): void {
  record(`${ip}:${email}`);
  record(ip);
}

export function resetLoginAttempts(ip: string, email: string): void {
  reset(`${ip}:${email}`);
  reset(ip);
}