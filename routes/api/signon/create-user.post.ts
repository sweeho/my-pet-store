import { defineHandler, readBody } from "nitro/h3";

import { createUser } from "../../../auth/authenticate";
import { SIGN_ON_WELCOME_PAGE } from "../../../auth/protected-resources";
import { setSignedOn, useSignOnSession } from "../../../auth/session";
import { CreateUserError } from "../../../auth/validation";

const USER_CREATION_ERROR_PAGE = "/user-creation-error";

type CreateUserBody = {
  j_username?: unknown;
  j_password?: unknown;
  j_password_2?: unknown;
};

type CreateUserResult =
  | { created: true; redirectTo: string }
  | { created: false; error: string; redirectTo: string };

export default defineHandler(async (event): Promise<CreateUserResult> => {
  const body = await readBody<CreateUserBody>(event);
  const userName = typeof body?.j_username === "string" ? body.j_username : "";
  const password = typeof body?.j_password === "string" ? body.j_password : "";
  const passwordConfirmation = typeof body?.j_password_2 === "string" ? body.j_password_2 : "";

  if (password !== passwordConfirmation) {
    return {
      created: false,
      error: "Passwords do not match",
      redirectTo: USER_CREATION_ERROR_PAGE,
    };
  }

  try {
    createUser(userName, password);
  } catch (error) {
    if (error instanceof CreateUserError) {
      return { created: false, error: error.message, redirectTo: USER_CREATION_ERROR_PAGE };
    }
    throw error;
  }

  setSignedOn(useSignOnSession(event), userName);
  return { created: true, redirectTo: SIGN_ON_WELCOME_PAGE };
});
