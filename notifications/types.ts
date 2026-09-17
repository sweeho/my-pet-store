// The notification vocabulary (design.md § Decisions D2, D3; PLAN.md
// § Fixed interface contracts). order/approval-types.ts re-exports
// NotificationKind from here rather than declaring its own, so the two
// vocabularies cannot drift.
export type NotificationKind = "APPROVAL" | "DENIAL" | "COMPLETION";

// QUEUED is the only status this ticket ever writes; SENT/FAILED/
// UNDELIVERABLE are the terminal states the drain pass (SWHM-T-0226) moves
// a row to (design.md § Decisions D6, D7).
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "UNDELIVERABLE";

// What a notification is sent to and addressed as, resolved from the
// account at send time (design.md § Decisions D5) — never from the order's
// own copied billing fields. Every field is nullable: an account can leave
// any of them empty (F6).
export type NotificationRecipient = {
  email: string | null;
  givenName: string | null;
  familyName: string | null;
};
