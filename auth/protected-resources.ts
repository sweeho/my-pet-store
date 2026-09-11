export const SIGN_ON_PAGE = "/signon";
export const SIGN_ON_ERROR_PAGE = "/signon-failed";
export const SIGN_ON_WELCOME_PAGE = "/signon-welcome";

export const PROTECTED_RESOURCES = [
  { legacy: "customer.screen", path: "/customer" },
  { legacy: "customer.do", path: "/api/customer" },
  { legacy: "enter_order_information.screen", path: "/enter-order-information" },
  { legacy: "signon_welcome.screen", path: "/signon-welcome" },
] as const;

function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

export function isProtectedResource(path: string): boolean {
  const normalized = normalizePath(path);
  return PROTECTED_RESOURCES.some((resource) => resource.path === normalized);
}
