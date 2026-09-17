import { StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

const NotFound = () => {
  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto mt-16 p-6")}>
        <h1 className="text-foreground text-center text-4xl font-bold">Not Found</h1>
        <p className="text-muted-foreground mt-2 text-center text-lg">
          The page you are looking for does not exist.
        </p>
      </div>
    </>
  );
};

export default NotFound;
