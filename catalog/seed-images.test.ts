import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CATALOG_SEED } from "./seed";

// RC-2 (openspec/changes/swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00/design.md):
// catalog/seed.ts named image locations that public/ never shipped, so every
// request 404'd to the placeholder with nothing to catch the gap. This walks
// the seed the same way the app serves it — every distinct `image` value —
// and asserts the file actually exists on disk under public/.
function distinctImageLocations(): string[] {
  const locations = new Set<string>();
  for (const seedCategory of CATALOG_SEED) {
    for (const seedProduct of seedCategory.products) {
      for (const seedItem of seedProduct.items) {
        for (const detail of seedItem.details) {
          locations.add(detail.image);
        }
      }
    }
  }
  return [...locations];
}

describe("catalog/seed image assets", () => {
  it("IT-01: every distinct seeded image location is a file the app actually ships", () => {
    const locations = distinctImageLocations();

    expect(locations.length).toBeGreaterThan(0);

    for (const location of locations) {
      const onDisk = path.join(process.cwd(), "public", location);
      expect(existsSync(onDisk), `${location} does not exist under public/`).toBe(true);
    }
  });

  it("IT-02: the seed names exactly the 20 distinct illustrations this ticket shipped", () => {
    expect(distinctImageLocations().sort()).toEqual(
      [
        "/images/birds/african-grey.svg",
        "/images/birds/amazon-parrot.svg",
        "/images/birds/gouldian-finch.svg",
        "/images/birds/zebra-finch.svg",
        "/images/cats/domestic-shorthair.svg",
        "/images/cats/maine-coon.svg",
        "/images/cats/persian.svg",
        "/images/cats/siamese.svg",
        "/images/dogs/english-bulldog.svg",
        "/images/dogs/french-bulldog.svg",
        "/images/dogs/standard-poodle.svg",
        "/images/dogs/toy-poodle.svg",
        "/images/fish/common-goldfish.svg",
        "/images/fish/fantail-goldfish.svg",
        "/images/fish/marble-angelfish.svg",
        "/images/fish/silver-angelfish.svg",
        "/images/reptiles/ball-python.svg",
        "/images/reptiles/bearded-dragon.svg",
        "/images/reptiles/corn-snake.svg",
        "/images/reptiles/leopard-gecko.svg",
      ].sort(),
    );
  });
});
