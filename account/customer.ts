import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { accounts, addresses, cardMetadata, contactInfo, customers, profiles } from "../db/schema";
import { lastFour as reduceToLastFour } from "./card";
import type { AccountUpdate, CustomerAccount } from "./types";

const DEFAULT_PROFILE = {
  preferredLanguage: "en_US",
  favoriteCategory: null,
  myListPreference: true,
  bannerPreference: true,
} as const;

const EMPTY_CONTACT_INFO = {
  givenName: null,
  familyName: null,
  telephone: null,
  email: null,
} as const;

const EMPTY_ADDRESS = {
  streetName1: null,
  streetName2: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
} as const;

const EMPTY_CARD = { cardType: null, expiryDate: null, lastFour: null } as const;

// ejbPostCreate's defaulting, in one call: the account and profile rows are
// written with the spec's defaults, and the contact/address/card rows are
// written empty so registration always leaves a full, readable row set
// (INTERFACES.md § Tables, design.md D2).
export function createCustomer(userName: string): CustomerAccount {
  db.insert(customers).values({ userName }).run();
  db.insert(accounts).values({ userName, status: "active" }).run();
  db.insert(profiles)
    .values({ userName, ...DEFAULT_PROFILE })
    .run();
  db.insert(contactInfo).values({ userName }).run();
  db.insert(addresses).values({ userName }).run();
  db.insert(cardMetadata).values({ userName }).run();

  return findAccount(userName)!;
}

export function findAccount(userName: string): CustomerAccount | undefined {
  const account = db.select().from(accounts).where(eq(accounts.userName, userName)).get();
  if (!account) return undefined;

  const profile = db.select().from(profiles).where(eq(profiles.userName, userName)).get();
  const contact = db.select().from(contactInfo).where(eq(contactInfo.userName, userName)).get();
  const address = db.select().from(addresses).where(eq(addresses.userName, userName)).get();
  const card = db.select().from(cardMetadata).where(eq(cardMetadata.userName, userName)).get();

  return {
    userName,
    status: account.status,
    contactInfo: contact
      ? {
          givenName: contact.givenName,
          familyName: contact.familyName,
          telephone: contact.telephone,
          email: contact.email,
        }
      : { ...EMPTY_CONTACT_INFO },
    address: address
      ? {
          streetName1: address.streetName1,
          streetName2: address.streetName2,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        }
      : { ...EMPTY_ADDRESS },
    card: card
      ? { cardType: card.cardType, expiryDate: card.expiryDate, lastFour: card.lastFour }
      : { ...EMPTY_CARD },
    profile: profile
      ? {
          preferredLanguage: profile.preferredLanguage,
          favoriteCategory: profile.favoriteCategory,
          myListPreference: profile.myListPreference,
          bannerPreference: profile.bannerPreference,
        }
      : { ...DEFAULT_PROFILE },
  };
}

// A customer registered before this ticket has no rows at all. The read path
// must return defaults rather than a 404 (design.md D4).
export function getAccountOrDefaults(userName: string): CustomerAccount {
  return (
    findAccount(userName) ?? {
      userName,
      status: "active",
      contactInfo: { ...EMPTY_CONTACT_INFO },
      address: { ...EMPTY_ADDRESS },
      card: { ...EMPTY_CARD },
      profile: { ...DEFAULT_PROFILE },
    }
  );
}

export function updateAccount(userName: string, update: AccountUpdate): CustomerAccount {
  if (update.contactInfo) {
    db.update(contactInfo).set(update.contactInfo).where(eq(contactInfo.userName, userName)).run();
  }

  if (update.address) {
    db.update(addresses).set(update.address).where(eq(addresses.userName, userName)).run();
  }

  if (update.card) {
    const { cardType, expiryDate, cardNumber } = update.card;
    const cardSet: { cardType?: string | null; expiryDate?: string | null; lastFour?: string } = {};
    if (cardType !== undefined) cardSet.cardType = cardType;
    if (expiryDate !== undefined) cardSet.expiryDate = expiryDate;
    if (cardNumber) cardSet.lastFour = reduceToLastFour(cardNumber);
    db.update(cardMetadata).set(cardSet).where(eq(cardMetadata.userName, userName)).run();
  }

  if (update.profile) {
    db.update(profiles).set(update.profile).where(eq(profiles.userName, userName)).run();
  }

  return getAccountOrDefaults(userName);
}
