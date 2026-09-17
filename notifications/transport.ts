// The outward delivery boundary (design.md § Decisions D8; PLAN.md § Fixed
// interface contracts). Mirrors payment/processor.ts, the repository's one
// existing instance of this shape (F8): an interface plus a default
// implementation, injectable so a test — or, later, a real mail service —
// can supply its own. No mail/SMTP dependency is added and no credentials
// are held, because the repository has nowhere to put them (F5). The
// default records what would have been sent rather than delivering it,
// which is what makes "a notification was sent to this address" a fact
// observable below the browser.
import type { MailMessage } from "./types";

export interface MailTransport {
  send(message: MailMessage): void;
}

export type RecordedMail = MailMessage & { sentAt: Date };

const sent: RecordedMail[] = [];

export const recordingTransport: MailTransport & { readonly sent: readonly RecordedMail[] } = {
  sent,
  send(message: MailMessage): void {
    sent.push({ ...message, sentAt: new Date() });
  },
};
