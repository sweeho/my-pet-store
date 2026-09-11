export type ContactInfo = {
  givenName: string | null;
  familyName: string | null;
  telephone: string | null;
  email: string | null;
};

export type Address = {
  streetName1: string | null;
  streetName2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
};

export type CardMetadata = {
  cardType: string | null;
  expiryDate: string | null;
  lastFour: string | null;
};

export type Profile = {
  preferredLanguage: string;
  favoriteCategory: string | null;
  myListPreference: boolean;
  bannerPreference: boolean;
};

export type CustomerAccount = {
  userName: string;
  status: string;
  contactInfo: ContactInfo;
  address: Address;
  card: CardMetadata;
  profile: Profile;
};

export type AccountUpdate = {
  contactInfo?: Partial<ContactInfo>;
  address?: Partial<Address>;
  card?: { cardType?: string | null; expiryDate?: string | null; cardNumber?: string | null };
  profile?: Partial<Profile>;
};
