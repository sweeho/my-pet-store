import { defineHandler, setResponseStatus } from "nitro/h3";

import { getAccountOrDefaults } from "../../../account/customer";
import type { CustomerAccount } from "../../../account/types";
import { useSignOnSession } from "../../../auth/session";

type GetCustomerResult = CustomerAccount | { error: string };

export default defineHandler((event): GetCustomerResult => {
  const { j_signon_username: userName } = useSignOnSession(event);

  if (!userName) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  return getAccountOrDefaults(userName);
});
