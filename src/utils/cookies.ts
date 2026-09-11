export function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return undefined;

  return decodeURIComponent(match.slice(name.length + 1));
}
