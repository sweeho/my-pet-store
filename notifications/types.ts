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

// buildMessage's output (SWHM-T-0225): what a transport is handed. `to` is
// carried on the message rather than re-derived from `recipient`, because
// the fallback to the order's copied billing address (design.md § Decisions
// D5) is the dispatcher's call, not the builder's (PLAN.md § Fixed
// interface contracts).
export type MailMessage = { to: string; subject: string; body: string };

// buildMessage's input. `status` is a plain string, not OrderStatus —
// the builder only ever names it in prose, it never branches on it.
export type MessageInput = {
  orderId: number;
  kind: NotificationKind;
  status: string;
  recipient: NotificationRecipient;
  to: string;
};
