// Entity types, fixed in artifacts/SWHM-S-0004/INTERFACES.md § Types.
export type Locale = string; // any string; an unsupported one yields null / EMPTY_PAGE, never an error

export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
};

// The 13 attributes the spec's "Item is retrieved with all attributes" scenario names.
export type Item = {
  itemId: string;
  category: string;
  productId: string;
  productName: string;
  description: string;
  imageLocation: string;
  attribute1: string | null;
  attribute2: string | null;
  attribute3: string | null;
  attribute4: string | null;
  attribute5: string | null;
  listPrice: number;
  unitCost: number;
};

export type Page<T> = {
  objects: T[];
  start: number;
  hasNext: boolean;
};
