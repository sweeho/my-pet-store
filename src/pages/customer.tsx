import { RequireSignOn } from "@/components";

type SessionInfo = { j_signon_username: string | null };

function CustomerContent() {
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
      <h1 className="text-foreground text-2xl font-bold">Customer</h1>
      {username && <p className="text-foreground">Signed in as {username}</p>}
    </div>
  );
}

export default function Customer() {
  return (
    <RequireSignOn>
      <CustomerContent />
    </RequireSignOn>
  );
}
