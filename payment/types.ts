import type { CardMetadata } from "../account/types";

// The fields a checkout payment submission carries, fixed by the mockup
// (cardNumber, cardType, cardholderName, expiryMonth, expiryYear —
// design.md § Design references). Transient: cardNumber and cardholderName
// are held only for the length of an authorization request and are never
// persisted (design.md D1, S1, S3).
export type CardSubmission = {
  cardNumber: string;
  cardType: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
};

// What is stored is the existing account card row — imported, never
// redefined (design.md D8, F1, F6).
export type StoredCard = CardMetadata;
