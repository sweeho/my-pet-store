import type { FormEvent } from "react";
import { Link } from "react-router";

import { Button } from "@/components";

export default function AdminSignOn() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("jps_admin");
  const [password, setPassword] = useState("admin");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/signon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ j_username: username, j_password: password }),
    });
    const result: { signedOn: boolean } = await response.json();
    navigate(result.signedOn ? "/admin" : "/admin/signon-failed");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-8">
      <div>
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold">
            MPS
          </div>
          <span className="text-muted-foreground text-sm">My Pet Store · Administration</span>
        </div>
        <h1 className="text-foreground mt-6 text-2xl font-bold">Administrator Sign In</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Fields are pre-filled with the development default credentials.
        </p>
        <form
          aria-label="Administrator sign in"
          onSubmit={handleSignIn}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="j_username" className="text-foreground text-sm font-medium">
              Username
            </label>
            <input
              id="j_username"
              name="j_username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="j_password" className="text-foreground text-sm font-medium">
              Password
            </label>
            <input
              id="j_password"
              name="j_password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>

      <Link to="/" className="text-foreground text-sm underline-offset-4 hover:underline">
        ← Back to store
      </Link>
    </div>
  );
}
