// The authorization boundary (design.md § Decisions D5): an interface plus
// a deterministic default implementation, injectable so a test — or, later,
// a real gateway — can supply its own. No live gateway is integrated; the
// requirement observes that a request was sent, not that money moved
// (design.md § Spec discrepancies S6, S10).
export type AuthorizationRequest = { cardType: string; lastFour: string; expiryDate: string };
export type AuthorizationDecision = "approved" | "declined";

export interface PaymentProcessor {
  authorize(request: AuthorizationRequest): AuthorizationDecision;
}

// The sentinel that makes a decline reproducible without a network call or
// randomness — the same convention real test-card numbers use (e.g. a
// gateway's own "ends in 0002 declines" test card).
export const DECLINED_LAST_FOUR = "0002";

export const stubProcessor: PaymentProcessor = {
  authorize(request) {
    return request.lastFour === DECLINED_LAST_FOUR ? "declined" : "approved";
  },
};
