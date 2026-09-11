import { RequireSignOn } from "@/components";

type SessionInfo = { j_signon_username: string | null };

function SignOnWelcomeContent() {
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-foreground text-2xl font-bold">
        Welcome{username ? `, ${username}` : ""}
      </h1>
    </div>
  );
}

export default function SignOnWelcome() {
  return (
    <RequireSignOn>
      <SignOnWelcomeContent />
    </RequireSignOn>
  );
}
