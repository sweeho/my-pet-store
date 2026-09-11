import { defineHandler, readBody } from "nitro/h3";

import { authenticate } from "../../../auth/authenticate";
import { SIGN_ON_ERROR_PAGE, SIGN_ON_WELCOME_PAGE } from "../../../auth/protected-resources";
import { forgetUsername, rememberUsername } from "../../../auth/remember-cookie";
import { setSignedOn, useSignOnSession } from "../../../auth/session";

type SignOnBody = {
  j_username?: unknown;
  j_password?: unknown;
  j_remember_username?: unknown;
};

type SignOnResult =
  | { signedOn: true; redirectTo: string }
  | { signedOn: false; redirectTo: string };

export default defineHandler(async (event): Promise<SignOnResult> => {
  const body = await readBody<SignOnBody>(event);
  const userName = typeof body?.j_username === "string" ? body.j_username : undefined;
  const password = typeof body?.j_password === "string" ? body.j_password : undefined;

  if (body?.j_remember_username && userName) {
    rememberUsername(event, userName);
  } else {
    forgetUsername(event);
  }

  const signedIn =
    userName !== undefined && password !== undefined && authenticate(userName, password);
  if (!signedIn) {
    return { signedOn: false, redirectTo: SIGN_ON_ERROR_PAGE };
  }

  const session = setSignedOn(useSignOnSession(event), userName);
  return { signedOn: true, redirectTo: session.original_url ?? SIGN_ON_WELCOME_PAGE };
});
