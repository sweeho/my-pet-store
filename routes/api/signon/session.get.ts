import { defineHandler } from "nitro/h3";

import { useSignOnSession } from "../../../auth/session";

export default defineHandler((event) => {
  const session = useSignOnSession(event);

  return {
    j_signon: session.j_signon,
    j_signon_username: session.j_signon_username,
    original_url: session.original_url,
  };
});
