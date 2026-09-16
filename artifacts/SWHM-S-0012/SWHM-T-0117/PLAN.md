# SWHM-T-0117 — Admin API module and shared request guard

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 4. Rich Client Request Handler (ApplRequestProcessor)` (4.1–4.5)
**Requirement:** foundation for the four administrative read/write requirements

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S4 and D6 govern this ticket.** The group describes a servlet parsing an XML
> envelope and dispatching on a request-type discriminator; here the request type _is_ the route and
> the envelope is JSON, so what the group genuinely asks for is the shared part.

## Objective

Create the `admin/` capability module and the one guard every administrative route calls. After this
ticket no endpoint exists yet — SWHM-T-0118 adds the first — but the contract they all share does,
and the module's tests run in the right Vitest project.

## Steps

1. **Register the `admin` directory in `vitest.config.ts` first, before writing any module code.**
   Add its glob to the `server` project's `include` _and_ to the `client` project's `exclude`. Both
   lists name the directories literally, exactly as `auth`, `account` and `catalog` already appear in
   them. Adding it to only one is the failure mode: a module test that reaches `db/client.ts` from the
   jsdom project cannot resolve `bun:sqlite` at all, and the error names the builtin rather than the
   config, so it reads as a dependency problem (ARCHITECTURE.md § Cross-cutting constraints). Do this
   step first so every later test in this sprint runs where it belongs.
2. **`admin/types.ts`** — the shared response shapes. Keep it to what more than one route needs: the
   error body, and the administrator context the guard produces.
3. **`admin/request.ts`** — `requireAdmin(event)`. It resolves the session with the existing
   `useSignOnSession`, reads the role through `auth/user.ts`, and either returns the administrator
   context or produces the refusal. It does **not** re-implement the access decision: the path-level
   check already ran in `middleware/signon.ts` against `evaluateAccess()`. This guard exists because a
   route needs the _username_ and a typed refusal it can return, not because the decision is made
   twice — if you find yourself writing a second rule about which paths are admin paths, stop and
   escalate (ARCHITECTURE.md § Key Decisions).
4. **One error shape for every admin route**: an HTTP status plus `{ error: string }`, matching how
   `routes/api/catalog/categories/index.get.ts` already answers a bad request. 401 for no session, 403
   for a session without the role — the two are distinct, for the same reason the access verdict
   distinguishes them (D3). No XML, no `<Error>` element, no request-type discriminator.
5. **Tests** in `admin/request.test.ts`, against a real `H3Event` with no server, as the route tests do.
   Cover: no session → 401; signed-on without the role → 403; administrator → context carrying the
   username; and that the two refusals are distinguishable by status, not only by message.

## Fixed interface contracts

SWHM-T-0118, SWHM-T-0119, SWHM-T-0120 and SWHM-T-0121 all call `requireAdmin` and return
`AdminError` on refusal. Changing either is a plan revision, not an implementation choice.

```ts
// admin/types.ts
export type AdminError = { error: string };
export type AdminContext = { userName: string };

// admin/request.ts
// Returns the context when the caller holds the role; otherwise sets the response
// status (401 or 403) on the event and returns the error body to be returned as-is.
export function requireAdmin(event: H3Event): AdminContext | AdminError;
export function isAdminError(result: AdminContext | AdminError): result is AdminError;
```

Every route under `routes/api/admin/` begins:

```ts
const ctx = requireAdmin(event);
if (isAdminError(ctx)) return ctx;
```

## File/module ownership

Create or modify only: `admin/request.ts`, `admin/request.test.ts`, `admin/types.ts`,
`vitest.config.ts`.

Nothing else. No route under `routes/api/admin/` — the first is SWHM-T-0118's. No change to
`auth/`, which SWHM-T-0114 owns this sprint.

## Definition of Done

AC-1 through AC-4 on the ticket, plus: `admin/**` appears in both Vitest project lists, and
`admin/request.test.ts` is observed running under the `server` project rather than jsdom.

## Gotchas

- `admin/` must not be named `utils` and must not live under `routes/` — a `.ts` file under `routes/`
  becomes an HTTP route whether or not it exports a handler (ARCHITECTURE.md § Routing).
- A jsdom-project test that loads `db/client.ts` fails with an error naming `bun:sqlite`, which reads
  like a missing dependency. It is the Vitest project, every time.
- The guard is not the access decision. `middleware/signon.ts` already refused anyone the path-level
  rule excludes; this runs after that and answers a different question.
