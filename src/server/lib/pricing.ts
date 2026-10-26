/**
 * Server-side source of truth for registration pricing.
 *
 * The client display table lives in src/data/conference.ts and must stay in
 * sync with this one, but nothing the client sends is ever trusted for
 * charging — amounts charged, verified and settled always come from here.
 */
export const REGISTRATION_PRICING: Record<string, number> = {
  virtual: 35000,
  "member-early": 50000,
  "member-late": 60000,
  "nonmember-early": 70000,
  "nonmember-late": 80000,
  "membership-early": 80000,
  "membership-late": 90000,
};

export const PAYSTACK_CURRENCY = "NGN";

export function getServerPrice(categoryId: string): number {
  const price = REGISTRATION_PRICING[categoryId];
  if (!price || price <= 0) throw new Error("Invalid registration category");
  return price;
}

/** Naira (major unit) → kobo (minor unit) as Paystack expects. */
export function toKobo(amountNaira: number): number {
  return Math.round(amountNaira * 100);
}

/**
 * Settlement guard: verifies that the amount Paystack reports (kobo) covers
 * the server-computed expected price for the attendee's category.
 *
 * Accepts exact matches as well as transactions where Paystack passes customer
 * processing fees (1.5% + ₦100, capped at ₦2,000 in Nigeria + standard gateway margin).
 * Strictly rejects any underpayment.
 */
export function isAmountMatch(paidKobo: number, expectedNaira: number): boolean {
  if (!Number.isFinite(paidKobo) || paidKobo <= 0) return false;
  const expectedKobo = toKobo(expectedNaira);
  if (paidKobo === expectedKobo) return true;

  // Maximum allowable gateway processing fee pass-through (up to ₦2,500 in kobo)
  const maxFeeKobo = Math.min(Math.round(expectedKobo * 0.05) + 250000, 250000);
  if (paidKobo >= expectedKobo && paidKobo <= expectedKobo + maxFeeKobo) {
    return true;
  }

  return false;
}

/** Pure settlement guard: paid currency must match the attendee's currency. */
export function isCurrencyMatch(
  paidCurrency: string | null | undefined,
  expectedCurrency: string | null | undefined,
): boolean {
  const paid = (paidCurrency ?? "").trim().toUpperCase();
  const expected = (expectedCurrency ?? PAYSTACK_CURRENCY).trim().toUpperCase();
  return paid !== "" && paid === expected;
}
