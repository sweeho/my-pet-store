import { Link } from "react-router";

import { StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

export default function About() {
  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto p-6")}>
        <h1 className="text-foreground mb-4 text-4xl font-bold">About Page</h1>
        <p className="text-muted-foreground mb-6">
          This is the about page demonstrating static routing.
        </p>
        <p className="text-foreground mb-4">Route: /about</p>
        <Link to="/" className="text-foreground text-sm underline-offset-4 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </>
  );
}
