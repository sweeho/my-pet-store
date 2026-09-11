import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { updateAccount } from "../../../account/customer";
import type { AccountUpdate, CustomerAccount } from "../../../account/types";
import { AccountValidationError, validateAccountUpdate } from "../../../account/validation";
import { useSignOnSession } from "../../../auth/session";

type UpdateCustomerResult = CustomerAccount | { error: string };

export default defineHandler(async (event): Promise<UpdateCustomerResult> => {
  const { j_signon_username: userName } = useSignOnSession(event);

  if (!userName) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  const update = (await readBody<AccountUpdate>(event)) ?? {};

  try {
    validateAccountUpdate(update);
  } catch (error) {
    if (!(error instanceof AccountValidationError)) throw error;
    setResponseStatus(event, 400);
    return { error: error.message };
  }

  return updateAccount(userName, update);
});
