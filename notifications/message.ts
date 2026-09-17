// The email content builder (design.md § Decisions S5, § Phases "2. Email
// generation"). Pure: no database read, no I/O — a function of the order
// id, kind, status, resolved recipient and the already-decided `to`
// address alone. Address selection belongs to the dispatcher
// (SWHM-T-0226), not here (PLAN.md § Fixed interface contracts).
import type { MailMessage, MessageInput, NotificationRecipient } from "./types";

// Neither field is guaranteed (F6): join whichever exist, and fall back to
// no name fragment at all rather than emit "null", an empty placeholder or
// a trailing/leading space when one or both are absent.
function customerName(recipient: NotificationRecipient): string | null {
  const parts = [recipient.givenName, recipient.familyName].filter((part): part is string =>
    Boolean(part),
  );
  return parts.length > 0 ? parts.join(" ") : null;
}

function greeting(recipient: NotificationRecipient): string {
  const name = customerName(recipient);
  return name ? `Dear ${name},` : "Hello,";
}

const SUBJECTS: Record<MessageInput["kind"], (orderId: number) => string> = {
  APPROVAL: (orderId) => `Your order #${orderId} has been approved`,
  DENIAL: (orderId) => `Your order #${orderId} has been denied`,
  COMPLETION: (orderId) => `Your order #${orderId} has shipped`,
};

const BODY_LINES: Record<MessageInput["kind"], (orderId: number) => string> = {
  APPROVAL: (orderId) => `We're pleased to let you know that order #${orderId} has been approved.`,
  DENIAL: (orderId) => `We're sorry to let you know that order #${orderId} has been denied.`,
  COMPLETION: (orderId) => `Order #${orderId} has shipped and is now complete.`,
};

export function buildMessage(input: MessageInput): MailMessage {
  const { orderId, kind, status, recipient, to } = input;

  return {
    to,
    subject: SUBJECTS[kind](orderId),
    body: [greeting(recipient), BODY_LINES[kind](orderId), `Current status: ${status}`].join(
      "\n\n",
    ),
  };
}
