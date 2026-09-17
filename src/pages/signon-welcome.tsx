import { RequireSignOn, StoreHeader } from "@/components";
import { CONTENT_WIDTH } from "@/components/layout";
import { cn } from "@/utils";

type SessionInfo = { j_signon_username: string | null };

export function SignOnWelcomeContent() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/signon/session")
      .then((response) => response.json() as Promise<SessionInfo>)
      .then((session) => {
        if (!cancelled) setUsername(session.j_signon_username);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StoreHeader />
      <div className={cn(CONTENT_WIDTH, "mx-auto flex flex-col gap-4 p-6")}>
        <h1 className="text-foreground text-2xl font-bold">
          Welcome{username ? `, ${username}` : ""}
        </h1>
      </div>
    </>
  );
}

export default function SignOnWelcome() {
  return (
    <RequireSignOn>
      <SignOnWelcomeContent />
    </RequireSignOn>
  );
}
