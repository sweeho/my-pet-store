# Architecture

See [PRODUCT.md](./PRODUCT.md) for what this is, [DESIGN.md](./DESIGN.md) for the visual system, [README.md](./README.md) for worked examples of every pattern below.

My Pet Store is a single deployable: one Vite process serves a React SPA and a Nitro API together in development, and one Nitro server output serves the built application in production. There is no separate frontend host, no separate API service, and no external datastore.

## Stack

- **Framework**: Vite 8 running a React 19 SPA + a Nitro 3 server together
- **Language**: TypeScript 5 (strict)
- **Frontend routing**: `vite-plugin-pages` (file-based) + `react-router` 8
- **Backend routing**: Nitro 3 / H3 2 (file-based)
- **Database**: SQLite via Bun's built-in `bun:sqlite` + Drizzle ORM — schema/client in `db/`, migrations in `drizzle/`. Requires the Bun runtime in dev, test and production (see Deployment)
- **Styling**: Tailwind CSS v4, CSS-first — tokens live in CSS, not in a config file. (`tailwind.config.ts` exists as an empty tracked file inherited from the template and is read by nothing.)
- **UI primitives**: shadcn/ui-style — Radix Slot, `class-variance-authority`, `cn()`
- **Icons**: `lucide-react`, `@heroicons/react`
- **Auto-imports**: `unplugin-auto-import` — `react` + `react-router` need no import
- **Fonts**: `unplugin-fonts` (config in `configs/fonts.config.ts`)
- **Tests**: Vitest + Testing Library (unit/integration/UI), Playwright (E2E/smoke)
- **Lint/format**: ESLint 9 + typescript-eslint, Prettier, Husky + lint-staged

## Directory structure

```
.
├── src/
│   ├── components/ui/   # shadcn/ui-style primitives (+ *.test.tsx)
│   ├── components/       # Behavioural components that are not design-system primitives
│   ├── pages/            # Frontend routes, file-based (+ *.test.tsx)
│   ├── hooks/, utils/, types/, constants/, data/, store/
│   ├── test/              # Vitest setup
│   ├── index.css           # Tailwind v4 + design tokens
│   └── main.tsx
├── routes/api/            # Backend routes, file-based (+ *.test.ts)
├── middleware/             # Runs before every route handler
├── auth/                    # Server-side authentication modules (+ *.test.ts) — not a scanned directory
├── db/                       # Drizzle schema.ts + client.ts (sqlite connection, migrate, seed)
├── drizzle/                   # Generated SQL migrations (drizzle-kit generate), committed
├── e2e/                      # Playwright specs + global-setup.ts
├── openspec/                  # Specs of record + in-flight changes
├── artifacts/                  # Per-sprint planning and validation records
├── legacy-analysis/             # Extraction records from the legacy application
├── configs/, scripts/
├── server.ts                  # Nitro server entry
├── vite.config.ts, vitest.config.ts, playwright.config.ts, drizzle.config.ts
├── tsconfig.json              # src
├── tsconfig.node.json           # server/config/test files
└── package.json
```

## Routing

**Frontend**: `src/pages/**/*.tsx` → routes (`about.tsx` → `/about`, `[id].tsx` → `/:id`, `[...all].tsx` → catch-all). `*.test.tsx` excluded via `Pages({ exclude })` in `vite.config.ts`.

**Backend**: `routes/api/*.ts` → `/api/*`, `middleware/*.ts` runs first and can set `event.context`. Requires `nitro({ serverDir: "./" })` in `vite.config.ts` — the default is `false`, which scans nothing. `*.test.ts` excluded via `nitro({ ignore })`.

Creating the file is the whole registration step on both sides; nothing lists routes anywhere.

Nitro scans `api/`, `routes/`, `middleware/`, `plugins/` and `tasks/`, and auto-imports from `utils/**`. **Server-side code that is not an endpoint must live outside those directories** — a `.ts` file under `routes/` becomes an HTTP route whether or not it exports a handler. That is why capability modules get their own top-level directory (`auth/` today) and why a new one must not be named `utils`.

## Data model

Defined in `db/schema.ts`:

- **users** — `id` (autoincrement pk), `name`, `email` (unique). Template demo content, seeded by `db/client.ts` and probed by `e2e/smoke.spec.ts`; not a product decision (PRODUCT.md § Not yet decided).
- **auth_users** — `user_name` (pk), `password`. The authenticated customer. Deliberately distinct from `users`: the demo table has no credential column and a numeric key, and its routes are regression cover that a repurpose would destroy. → `openspec/specs/user-authentication/`
- **sessions** — `id` (pk), `j_signon`, `j_signon_username`, `original_url`, `updated_at`. Per-visitor server-side state; the attribute names are the ones the authentication specification asserts.

Routes import `db` and the table objects directly (see `routes/api/users/`) — there is no repository layer, and adding one is a decision that has not been taken.

- After editing `db/schema.ts`, a migration must be generated into `drizzle/` and committed; the schema change is not complete without it.
- The database file is `sqlite.db` at the project root — gitignored, created on first run. The `drizzle/` migrations are committed.
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory database, so tests never touch the development database.
- `db/client.ts` resolves both `sqlite.db` and the migrations folder from `process.cwd()`, not `import.meta.url` — Vite, Nitro and Vitest all transform the module, so its `import.meta.url` is not a real `file://` URL.

## Request flow

`GET /api/hello`: `middleware/auth.ts` attaches a user to `event.context` → `routes/api/hello.ts` reads it and responds. `routes/api/users/[id].ts` shows the dynamic-route and `createError()` 404 pattern against a real Drizzle query.

`middleware/auth.ts` is a stub that attaches a hardcoded user to every request. It is not authentication and nothing may treat it as such.

Authentication is `middleware/signon.ts` and the handlers under `routes/api/signon/`. A request carries its session in an httpOnly cookie; the middleware resolves it, asks `auth/signon-filter.ts` whether the path is reachable, and on a denial records the requested path and answers with the sign-on destination instead of running the handler.

## Cross-cutting constraints

- **The Bun runtime is mandatory wherever `db/client.ts` loads.** It imports the `bun:sqlite` builtin, which Node cannot resolve. This is why the test script runs `bun --bun vitest`, why Playwright's web server names Vite's bin file under `bun --bun` rather than going through a shebang, and why the production process manager sets Bun as its interpreter. A path that loses `--bun` breaks every database-backed route while static pages and non-database routes stay green — the failure is silent by construction, which is why `e2e/smoke.spec.ts` probes a database-backed route deliberately.
- **Per-visitor state lives in the database, not in the process.** H3 2 ships cookie helpers but no session primitive, so the session is a row keyed by an opaque id in an httpOnly cookie. Anything that needs to remember something about a visitor between requests reads and writes that row rather than a module-level map, which would not survive a restart and would not be shared across processes.
- **Access control is decided in one pure function and enforced in two places.** SPA navigation never reaches the server, so a server-only filter would protect an API path and silently leave the equivalent page open in development, which is exactly where the browser tier runs. A new protected resource is added to the configuration, never as a new check.
- **TypeScript is strict**, with complete annotations on exported functions.
- **`auto-imports.d.ts` is generated, not committed.** It does not exist on a fresh clone; the `prebuild` and `pretypecheck` hooks create it. Any new tsc-only script needs the same hook or it fails only on a clean checkout.
- **Vitest runs as two projects, chosen by path**: tests for server-side code (`routes/**`, `auth/**`) run in the `server` project (node), everything else in `client` (jsdom). A test that reaches `db/client.ts` from the jsdom project cannot resolve `bun:sqlite` at all, so a new server-side directory must be added to that project's include when it is created.

## Testing

Four tiers, one worked example each; the browser tier runs on a dedicated port so it never collides with a development server. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md).

## Deployment

- `ecosystem.config.js` (PM2) runs the real build — `.output/server/index.mjs`, under Bun, as the constraint above requires. `nitro.service` (systemd) is the non-PM2 equivalent with the same requirement.
- `Dockerfile` / `docker-compose.yml` build a static `dist/` served by nginx. They never run `.output/server/index.mjs`, so they do not serve the Nitro API or the database-backed routes; they are inherited from the template and are not a supported deployment target as they stand.

## Key Decisions

Decisions that bind work beyond the change that made them. Each is authored where it was made; this is the index, not the record.

- **The bootstrap stack is adopted as-is and is settled.** Structure, tooling, routing, styling and dependency choices came from the `ts-reactjs-vite-tailwindcss` template (provenance in `bootstrap-tmpl.yaml`) and are not revisited per sprint — re-scaffolding trades a verified foundation for an unproven one and forfeits the regression cover the template's own suites already carry. Changing any of them requires an explicit proposal. _Authored in change `swhm-i-0001-bootstrap-my-pet-store` (D1)._
- **One CI workflow covers every tier**, on every sprint-branch push. A second workflow would double every check run on every sprint branch, and a tier proven only locally is not proven at all — the browser tier cannot run in an engineer container, so CI is where it is observed. _Authored in change `swhm-i-0001-bootstrap-my-pet-store` (D4)._
- **Session state is a database row behind an opaque httpOnly cookie**, and is the one place per-visitor state belongs. H3 2 offers no session primitive, and the alternative — process memory — loses every visitor on a restart and cannot be shared. _Authored in change `swhm-i-0002-user-authentication-sign-on`._
- **Protected resources are declared in configuration and enforced by a single decision function**, consumed by server middleware and by the client route guard. One decision with two enforcement points is the only arrangement that covers both an API path and a client-side navigation to the same resource. _Authored in change `swhm-i-0002-user-authentication-sign-on`._
- **Credentials are stored hashed, never as plaintext**, even where an extracted legacy specification describes plaintext comparison. The specification's scenarios observe only whether authentication succeeds, so the deviation costs nothing it specifies and removes a standing exposure from every capability that follows. Deviations of this kind are recorded against the sprint rather than by editing the extracted spec. _Authored in change `swhm-i-0002-user-authentication-sign-on`._
- **Server-side capability code lives in its own top-level directory, outside the ones Nitro scans**, with its tests registered in Vitest's `server` project. A module placed under `routes/` becomes a public endpoint by existing, and one tested from the jsdom project cannot load the database driver at all. _Authored in change `swhm-i-0002-user-authentication-sign-on`._
