# Komtru Operations

Internal admin / operations console for Komtru. **Not** the customer-facing app — there is no public
marketing surface here, and `/` redirects straight to `/dashboard`.

This repository is currently the **architecture skeleton**: shell, theming, HTTP layer, state layer
and shared form widgets. Feature modules are built from their own specs and mount into it.

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui ·
TanStack Query v5 · Zustand v5.

---

## Prerequisites

| Tool | Version |
| --- | --- |
| Node | ≥ 20.9 (developed on 22.x) |
| pnpm | ≥ 10 (`corepack enable pnpm`) |
| pm2 | only for production process management |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in real values
pnpm dev                     # http://localhost:7820
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 7820 with Turbopack |
| `pnpm build` | Production build (Turbopack) |
| `pnpm start:prod` | `next start` on port 7820 |
| `pnpm start` | Boots the app under pm2 as `komtru-ui` and saves the process list |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier with the Tailwind class sorter |

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Backend origin + version prefix, e.g. `http://localhost:7821/v1` |
| `NEXT_PUBLIC_APP_URL` | Public origin of this app; drives `metadataBase` |

`.env*` is git-ignored except `.env.example`. Never commit real keys. Add variables as modules need
them (websocket gateway, reCAPTCHA, error reporting) rather than up front.

## How requests work

The browser only ever calls **same-origin `/api/...`**. `next.config.ts` rewrites `/api/:path*` to
`NEXT_PUBLIC_BASE_URL`, so there is no CORS setup and retargeting the backend is a one-line env
change.

```
component → hook in services/<domain>.services.ts → http facade (services/base.ts) → /api/... → backend
```

- **`src/services/base.ts`** is the only file that imports `axios`. It exports a single `http`
  facade instance holding two axios instances (JSON + multipart). Every method takes one object
  argument and returns `response.data`.
- **Auth interceptors** attach `Bearer` from the session store, and branch on a **stable error code**
  (never on message text — codes live in the exported `AUTH_ERROR_CODES`). A revoked token
  hard-redirects to `/auth/logout?code=…`; an expired access token refreshes through a
  **single-flight queue** — N concurrent 401s produce exactly one `POST /auth/refresh-tokens`, and
  every queued request replays with the new token.
- Errors **always reject**, including network/timeout failures where `error.response` is
  `undefined`. Callers read `err.message` off the API error envelope (`errorMessageOf()` in
  `components/general/query-state.tsx` does this safely).
- Components never import `axios` or `http` — they call `use<Verb><Noun>` hooks.

`services/organization.services.ts` is the reference implementation of that pattern; copy its shape
for new modules.

## State

- **Server state → TanStack Query.** One hook per call in `src/services/<domain>.services.ts`, with
  structured exported query keys (`organizationKeys.current()`) and invalidation through
  `getQueryClient()`.
- **Client/session state → Zustand.** `store/auth.store.ts` persists the session to `localStorage`
  under `komtru-auth-store`. Because that rehydrates asynchronously, anything session-dependent is
  gated on `hydrated` (`waitForHydration()` for imperative callers). Small UI state gets its own
  non-persisted store (`store/sidebar.store.ts`).
- Server data is never duplicated into Zustand — the session is the single exception.

## Structure

```
src/
  app/
    layout.tsx                 # metadata, providers, Toaster, top loader
    page.tsx                   # redirect → /dashboard
    globals.css                # Tailwind v4 @theme brand tokens + shadcn vars
    fonts.ts                   # Space Grotesk / Inter / IBM Plex Mono
    (dashboard)/dashboard/     # shell (sidebar + topbar) + placeholder overview
  components/
    ui/                        # shadcn primitives (generated, then re-themed)
    general/                   # shell chrome, KomtruMark, Spinner, QueryState
    forms/                     # FloatingLabelInput, DatePicker, MultiSelect
    query-provider.tsx  theme-provider.tsx
  config/    brand.ts (the only raw hex), menu.tsx (nav structure)
  helpers/   format, timezones, delay
  hooks/     useCustomToast, useRowLoading, useDeviceTimeZone, use-mobile
  interfaces/  IAxios, auth, organization, common
  lib/       react-query.ts (QueryClient singleton), utils.ts (cn)
  services/  base.ts (facade), organization.services.ts
  store/     auth.store.ts, sidebar.store.ts
  middleware.ts
```

## Adding a module

1. `src/interfaces/<domain>.ts` — types and `string` enums for the domain.
2. `src/services/<domain>.services.ts` — query keys + one hook per endpoint.
3. `src/app/(dashboard)/dashboard/<domain>/page.tsx` — a thin server component that renders a
   `PascalCase.tsx` client component beside it (that is how the shell pages are laid out).
4. Register nav entries in `src/config/menu.tsx` — leaf (`href`) or collapsible group (`items`); the
   sidebar already renders both, including badge counts via `badgeKey`.
5. Wrap data in `<QueryState>` so loading / error / empty look the same everywhere.

## Styling

Brand tokens live in `@theme` inside `src/app/globals.css` as `--color-komtru-*`, which generates
`bg-komtru-navy`, `text-komtru-slate-500`, and so on. **Components use those classes — no raw hex.**
The single exception is `src/config/brand.ts`, for libraries that take a colour string rather than a
class (`nextjs-toploader`, `metadata.themeColor`).

Watch out for one Tailwind v4 trap, documented at the `@theme inline` block: `inline` theme variables
are compiled into utilities and never emitted as custom properties, so `var(--color-chart-1)`
resolves to nothing. Libraries that need a colour string (recharts, etc.) must use the emitted
`var(--chart-1)` / `var(--border)` / `var(--card)`.

There is no `tailwind.config.ts` and there should not be — Tailwind v4 is configured CSS-first.
Every colour has a dark counterpart under `.dark`; `next-themes` drives the class with
`defaultTheme="system"`.

## Forms

Formik + Yup, one `Yup.object({...})` schema per form declared above the component. `handleSubmit`
calls the service's `mutateAsync`, sets a local `error` string in `catch`, and clears
`setSubmitting(false)` in `finally`. Show API errors inline **and** through `useCustomToast`. Type
Formik helpers as `FormikHelpers<T>` — no `any`.

```tsx
<Field name="email" type="email" as={FloatingLabelInput} label="Email" required />
<ErrorMessage name="email" component="span" className="text-komtru-risk text-xs" />
```

## Auth status — read this before adding routes

**There is no login flow, on purpose.** The account model (roles, statuses, providers, login/2FA
payloads) is not defined, so nothing here pretends to authenticate:

- No `(authentication)` route group, no `auth.services.ts`, no role enums.
- `interfaces/auth.ts` carries only the token/session shapes the refresh interceptor needs, with
  `IAuth`/`IUser` as deliberately minimal placeholders.
- `middleware.ts` is a pass-through. `localStorage` tokens are invisible to the edge runtime, so a
  guard there would be theatre. When tokens also land in cookies, that is where the real guard goes;
  until then do client-side redirects in `DashboardShell` based on `hydrated && access`.
- `config/menu.tsx` shows every entry to every operator. Filter it once at the layout boundary when
  roles exist.

The plumbing is ready: the store, the `Bearer` request interceptor and the single-flight refresh
queue all work the moment a real login populates the session.

## Pre-installed but unused

The dependency set is installed up front per the project spec, so some packages have no call sites
yet: `@tanstack/react-table`, `recharts`, `react-dropzone`, `react-phone-number-input`,
`react-google-recaptcha`, `nookies`, `date-fns`, `uuid`. Use them when a module needs them, or drop
them if it turns out none does.

## Deploy

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start            # pm2 app "komtru-ui" on port 7820
pm2 logs komtru-ui
```

The pm2 app name and port in `ecosystem.config.json` match `package.json` — keep them in sync if
either changes.
