# Komtru Operations

Internal admin / operations console for Komtru. **Not** the customer-facing app — there is no public
marketing surface here: `/` is the operator sign-in screen and everything else lives under
`/dashboard`.

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
    globals.css                # Tailwind v4 @theme brand tokens + shadcn vars
    fonts.ts                   # Space Grotesk / Inter / IBM Plex Mono
    (auth)/                    # `/` email step + `/verify` OTP step
    (dashboard)/dashboard/     # shell (sidebar + topbar) + placeholder overview
  components/
    ui/                        # shadcn primitives (generated, then re-themed)
    general/                   # shell chrome, KomtruMark, Spinner, QueryState
    forms/                     # FloatingLabelInput, DatePicker, MultiSelect
    query-provider.tsx  theme-provider.tsx
  config/    brand.ts (the only raw hex), menu.tsx (nav structure)
  helpers/   format, timezones, delay, redirect (safe `redirect_uri` handling)
  hooks/     useCustomToast, useRowLoading, useDeviceTimeZone, use-mobile
  interfaces/  IAxios, auth, organization, common
  lib/       react-query.ts (QueryClient singleton), utils.ts (cn)
  services/  base.ts (facade), auth.services.ts, organization.services.ts
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

**The blended shell.** Chrome has no two-tone split: sidebar, topbar and content sit on one
continuous wash. Two utilities in `globals.css` do it, driven by the `--shell-*` / `--veil-*` vars:

- `shell-blend` — the wash. **Komtru Midnight `#0d1420` is its primary colour**: the base tone in
  dark, the tint hazing the cloud base in light, and the far-corner settle in both. Indigo appears
  only as a trace accent (≤ 7% alpha) so the result never reads as a blue gradient. It goes on the
  element that spans sidebar *and* content, and uses `background-attachment: fixed` so the fixed
  sidebar and the scrolling content stay in register.
- `surface-veil` — a panel that lifts off the wash instead of covering it: translucent fill,
  hairline edge, no shadow. Prefer it over `bg-card` for full-width page surfaces.

`--sidebar` intentionally equals `--background` in both themes; the only edge is a
`--sidebar-border` hairline. Panes inside `shell-blend` must stay transparent.

## Forms

Formik + Yup, one `Yup.object({...})` schema per form declared above the component. `handleSubmit`
calls the service's `mutateAsync`, sets a local `error` string in `catch`, and clears
`setSubmitting(false)` in `finally`. Show API errors inline **and** through `useCustomToast`. Type
Formik helpers as `FormikHelpers<T>` — no `any`.

```tsx
<Field name="email" type="email" as={FloatingLabelInput} label="Email" required />
<ErrorMessage name="email" component="span" className="text-komtru-risk text-xs" />
```

## Auth — read this before adding routes

Sign-in is **staff email OTP**, two steps, no password (the password endpoint is refused unless the
deployment opts in):

1. `/` — email input. `POST auth/staff/login/request` always answers **202 with a bare ack, no
   `data`**. That response is byte-identical for a real operator, a consumer, an unknown address and
   a throttled one — so success means "accepted", never "an email was sent", and no copy anywhere
   may imply the address exists. Routes to step 2 with the email (and any `redirect_uri`) in the
   query string, so a refresh or a bookmarked step-2 link still has what it needs.
2. `/verify` — segmented 6-digit field (`components/forms/otp-input.tsx`, auto-submits on the last
   digit; codes live 5 minutes, 5 attempts). `POST auth/staff/login/verify` answers **200 two ways**
   — a session, or `{ mfaRequired, mfaToken, factors }` when the account has an active factor.
   `helpers/session.ts#isMfaChallenge` discriminates them.

On a session: `useVerifyOtp` maps the flat tokens through `toAccess` and commits, then the form
`replace`s to `redirect_uri` or `/dashboard`. A non-null `nextStep` (`ENROL_MFA` for every bootstrap
admin) is outstanding *setup*, not a failed sign-in — the operator continues, with a toast.

> **Not built yet: the second factor.** `POST auth/mfa/verify` (mfaToken + factorId + code) is
> documented but has no screen, so `mfaRequired` renders an explicit "ask an administrator" state
> rather than pretending. Same for enrolment (`POST me/mfa/totp/enroll`). Note the API demands an
> enrolled factor even when `IDENTITY_STAFF_REQUIRE_MFA=false`, so this path activates the moment
> anyone enrols.

Session handling:

- **Tokens arrive flat** (`accessToken`, `refreshToken`, `expiresIn`) and are normalised to the
  nested pair the store holds by `helpers/session.ts#toAccess`. Only the access token gets an
  expiry; the refresh token is an opaque string.
- **Refresh is `POST auth/refresh` and tokens rotate** — presenting a spent one revokes the whole
  family, which is why the single-flight queue in `services/base.ts` is a correctness requirement,
  not an optimisation. The API also sets the refresh token as an HttpOnly cookie on `Path=/v1/auth`;
  that path is invisible through the `/api` rewrite, so the body value is what gets used.
- **401 is the only signal.** The API publishes no machine-readable sub-code (a distinguishable
  `REUSE_DETECTED` would tell an attacker their stolen token tripped the alarm), so the interceptor
  treats a 401 as "refresh once and replay", and a second failure as a dead session → clear the
  store, leave for `/?reason=session_expired`. 401s from `auth/staff/login/*` are exempt: that's a
  bad code, not a stale session. Access tokens last 10 minutes; staff sessions idle out at 30
  minutes and expire absolutely at 8 hours, so this path runs constantly.

Guard rails:

- `helpers/redirect.ts` narrows `redirect_uri` to a same-origin path, so a crafted link can't bounce
  a freshly-created session to another origin. Absolute, `//host` and `/\host` forms are rejected.
- `DashboardShell` gates the console on `hydrated && access` and renders nothing but a spinner until
  the session is known, bouncing to `/?redirect_uri=<where they were headed>`.
- `middleware.ts` is still a pass-through: `localStorage` tokens are invisible to the edge runtime,
  so a guard there would be theatre.
- **Staff sessions carry no tenant** — the store keeps `organization: null`, and the topbar labels
  the operator by username-or-email plus `publicId`. Roles/permissions are equally unmodelled: the
  token has a `scp: STAFF` claim but the response body doesn't expose the role, so `config/menu.tsx`
  shows every entry to every operator. Filter it once at the layout boundary when roles land.

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
