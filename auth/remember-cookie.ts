import { deleteCookie, setCookie, type H3Event } from "nitro/h3";

export const REMEMBER_COOKIE = "bp_signon";
export const REMEMBER_COOKIE_MAX_AGE = 2_678_400;

export function rememberUsername(event: H3Event, userName: string): void {
  setCookie(event, REMEMBER_COOKIE, userName, {
    maxAge: REMEMBER_COOKIE_MAX_AGE,
    path: "/",
  });
}

export function forgetUsername(event: H3Event): void {
  deleteCookie(event, REMEMBER_COOKIE, { path: "/" });
}
