export const SIGN_ON_PAGE = "/signon";
export const SIGN_ON_ERROR_PAGE = "/signon-failed";
export const SIGN_ON_WELCOME_PAGE = "/signon-welcome";

export const ADMIN_ROLE = "administrator";
export const ADMIN_SIGN_ON_PAGE = "/admin/signon";
export const ADMIN_SIGN_ON_ERROR_PAGE = "/admin/signon-failed";
export const ADMIN_HOME_PAGE = "/admin";

export type ProtectedResource = { legacy: string; path: string; requiresRole?: string };

// /admin/signon and /admin/signon-failed live under /admin but must stay
// reachable while signed out — they are how someone signs in (PLAN.md step 3).
const ADMIN_ENTRY_PATHS: readonly string[] = [ADMIN_SIGN_ON_PAGE, ADMIN_SIGN_ON_ERROR_PAGE];

export const PROTECTED_RESOURCES: ProtectedResource[] = [
  { legacy: "customer.screen", path: "/customer" },
  { legacy: "customer.do", path: "/api/customer" },
  { legacy: "enter_order_information.screen", path: "/enter-order-information" },
  { legacy: "order_completed.jsp", path: "/order-completed" },
  // Payment authorization has no counterpart in the legacy app (design.md §
  // Codebase findings F8) — these two are new, not ported.
  { legacy: "payment.screen", path: "/payment" },
  { legacy: "payment.authorize", path: "/api/payment" },
  { legacy: "signon_welcome.screen", path: "/signon-welcome" },
  { legacy: "index.jsp", path: ADMIN_HOME_PAGE, requiresRole: ADMIN_ROLE },
  { legacy: "AdminRequestProcessor", path: "/api/admin", requiresRole: ADMIN_ROLE },
  { legacy: "orders.jsp", path: "/admin/orders", requiresRole: ADMIN_ROLE },
];

function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

// An admin entry protects its whole subtree by prefix, so a future admin
// page nobody remembered to list here stays protected instead of defaulting
// to public (design.md D2, ARCHITECTURE.md § Routing). The four legacy
// entries keep the exact match they always had.
function matchesResource(resource: ProtectedResource, normalized: string): boolean {
  if (normalized === resource.path) return true;
  return resource.requiresRole !== undefined && normalized.startsWith(`${resource.path}/`);
}

export function findProtectedResource(path: string): ProtectedResource | undefined {
  const normalized = normalizePath(path);
  if (ADMIN_ENTRY_PATHS.includes(normalized)) return undefined;
  return PROTECTED_RESOURCES.find((resource) => matchesResource(resource, normalized));
}

export function isProtectedResource(path: string): boolean {
  return findProtectedResource(path) !== undefined;
}
