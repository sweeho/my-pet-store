export function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return undefined;

  return decodeURIComponent(match.slice(name.length + 1));
}

// Path=/ and an explicit Max-Age make the choice outlive the tab and apply
// on every route — a session cookie would not survive a fresh browser start.
// SameSite=Lax, not httpOnly/Secure: this cookie is written and read by the
// client, and the E2E tier runs over plain HTTP.
export function writeCookie(name: string, value: string, days = 365): void {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
