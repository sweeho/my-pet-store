import { Link } from "react-router";

import { Button, StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { STORE_NAME } from "@/constants";
import { cn } from "@/utils";

const highlights = ["Free shipping", "Vet-approved", "Curated brands", "Local pickup"];

const Home = () => {
  return (
    <>
      <StoreHeader />
      <main
        className={cn(CONTENT_WIDTH, "mx-auto flex flex-col items-center px-6 py-24 text-center")}
      >
        <span className="border-border text-muted-foreground rounded-full border px-3 py-1 text-sm">
          Now open for the neighborhood.
        </span>
        <h1 className="text-foreground mt-8 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {STORE_NAME}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-[500px] text-lg leading-relaxed text-pretty">
          Food, toys, and supplies for every dog, cat, and small pet in the family &mdash; curated
          by people who actually own them.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/catalog">Get started</Link>
        </Button>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {highlights.map((highlight) => (
            <span
              key={highlight}
              className="bg-secondary text-foreground rounded-full px-3 py-1 text-xs font-medium"
            >
              {highlight}
            </span>
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;
