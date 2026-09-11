import type { FormEvent } from "react";
import { Link } from "react-router";

import { Button } from "@/components";
import { readCookie } from "@/utils";

const REMEMBER_COOKIE = "bp_signon";

export default function SignOn() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => readCookie(REMEMBER_COOKIE) ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/signon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        j_username: username,
        j_password: password,
        j_remember_username: remember,
      }),
    });
    const result: { redirectTo: string } = await response.json();
    navigate(result.redirectTo);
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== newPassword2) {
      setSignUpError("Passwords do not match.");
      return;
    }
    setSignUpError(null);

    const response = await fetch("/api/signon/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        j_username: newUsername,
        j_password: newPassword,
        j_password_2: newPassword2,
      }),
    });
    const result: { created: boolean; redirectTo: string; error?: string } = await response.json();

    if (result.created) {
      navigate(result.redirectTo);
    } else {
      navigate(result.redirectTo, { state: { error: result.error } });
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-10 p-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Sign In</h1>
        <form aria-label="Sign in" onSubmit={handleSignIn} className="mt-4 flex flex-col gap-4">
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
          <div className="flex items-center gap-2">
            <input
              id="j_remember_username"
              name="j_remember_username"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <label htmlFor="j_remember_username" className="text-foreground text-sm">
              Remember My User Name
            </label>
          </div>
          <Button type="submit">Sign In</Button>
        </form>
      </div>

      <div>
        <h2 className="text-foreground text-xl font-bold">New Customer</h2>
        <form
          aria-label="Create a new account"
          onSubmit={handleSignUp}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="signup_j_username" className="text-foreground text-sm font-medium">
              Username
            </label>
            <input
              id="signup_j_username"
              name="j_username"
              type="text"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="signup_j_password" className="text-foreground text-sm font-medium">
              Password
            </label>
            <input
              id="signup_j_password"
              name="j_password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="signup_j_password_2" className="text-foreground text-sm font-medium">
              Repeat Password
            </label>
            <input
              id="signup_j_password_2"
              name="j_password_2"
              type="password"
              value={newPassword2}
              onChange={(event) => setNewPassword2(event.target.value)}
              className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            />
          </div>
          {signUpError && <p className="text-destructive text-sm">{signUpError}</p>}
          <Button type="submit">Create Account</Button>
        </form>
      </div>

      <Link to="/" className="text-foreground text-sm underline-offset-4 hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
