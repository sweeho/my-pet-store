export const MAX_USERID_LENGTH = 25;
export const MAX_PASSWD_LENGTH = 32;

export class CreateUserError extends Error {}

export function validateNewUser(userName: string, password: string): void {
  if (userName.length > MAX_USERID_LENGTH) {
    throw new CreateUserError(`User ID cant be more than ${MAX_USERID_LENGTH} chars long`);
  }
  if (userName.includes("%") || userName.includes("*")) {
    throw new CreateUserError("User Id cannot have '%' or '*' characters");
  }
  if (password.length > MAX_PASSWD_LENGTH) {
    throw new CreateUserError(`Password cant be more than ${MAX_PASSWD_LENGTH} chars long`);
  }
}
