# Test conventions

The rules the `tests/functional/` suite follows. This file is the single source of truth for
how tests are structured — cite it by number when reviewing a PR against it.

Adapted from a sibling project's Playwright framework conventions, with rules added or changed
where Meridian's actual API shape (dual auth tracks, a global route prefix with one exclusion,
role-scoped tenancy) differs. Deviations from the source framework are called out explicitly
below so they don't read as accidental drift.

When in doubt, the existing sibling files in the same feature folder are the reference
implementation — an existing `.actions.ts` / `.assertions.ts` / `.flow.ts` / `.data.ts` in
another domain shows the intended shape. Don't invent rules that aren't actually followed
elsewhere in the repo.

---

1. **File split per domain.** Each domain under `tests/functional/<domain>/[<feature>/]`
   separates concerns into `<name>.actions.ts` (raw request/page interactions), `<name>.assertions.ts`
   (checks), `<name>.data.ts` (typed data shapes), `<name>.flow.ts` (multi-step flows composed
   from actions, assertions, and other flows), and `<name>.spec.ts` (test cases). A domain's
   API-layer tests get their own file set with an `-api` suffix on the same base name
   (`login-api.actions.ts`, etc.), alongside any UI files in the same domain folder, following
   the identical split.

   **Domain folders map one-to-one to backend controllers**, named after the controller's
   route prefix exactly — `tenant/` for `@Controller('tenant')`, `gw/` for `@Controller('gw')`,
   never a paraphrase of the controller's module name. Verify the prefix with
   `grep "@Controller("` across `apps/api/src`, don't assume it from the README. The one
   exception: `overview/` is E2E-only, since the dashboard's Overview page composes `tenant`
   and `usage/summary` rather than mapping to a single controller.

   **Independently-testable sub-features get a subfolder** — `auth/login/`, `auth/logout/`,
   `auth/refresh/` are each their own subfolder because they're reached and tested
   independently, not states of one shared flow, even though all three sit under one
   `AuthController`. `tenant/rate-limit/` (A1) is the same call for `TenantsController`: the
   override is reached and tested independently of the base `GET`/`PATCH /tenant`, not a state of
   the same journey. This is a deliberate per-domain call, not a rule that every multi-route
   controller needs subfolders — a controller whose routes are only ever exercised together stays
   flat (`memberships/`, with its create/list/edit/delete all flat under one folder, is the
   counter-example). A subfolder's own file set drops the domain prefix the same way `auth/login/`
   does (`login-api.spec.ts`, not `auth-login-api.spec.ts`) — `rate-limit-override-set-api.spec.ts`,
   not `tenant-rate-limit-override-set-api.spec.ts`. The remaining `<resource>-<verb>` base
   (`rate-limit-override-set`) follows the same pattern as every flat-domain operation name
   (`memberships-create`, `tenant-details`) — function names carry it the same way, verb last:
   `sendRateLimitOverrideSetRequest`, not `sendSetRateLimitOverrideRequest`.

   **A read `.spec.ts`'s operation suffix says which shape of GET it is — `-details` for a
   single item, `-list` for a collection — never a bare `-get`.** `-get` doesn't distinguish the
   two, and breaks the moment a domain has both: `tenant/tenant-details-api.spec.ts` (`GET
   /tenant` returns one tenant) vs. `memberships/memberships-list-api.spec.ts` (`GET
   /memberships` returns an array). Action/assertion function names carry the same distinction —
   `sendTenantDetailsRequest`/`assertTenantDetailsSuccess`,
   `sendMembershipsListRequest`/`assertMembershipsListSuccess` — never `Get` in an exported name.
   Mutations keep their existing plain verbs (`-create`, `-edit`, `-delete`).

2. **`.spec.ts` files contain no raw request calls and no raw `expect(...)`.** They call
   flow / assertion helpers. Calling a single named **action** directly from a spec is fine
   when there's no multi-step journey to name — but a new interaction or check belongs in that
   domain's `.actions.ts` / `.assertions.ts`, never inline in the test.

3. **`.flow.ts` functions compose two or more steps** — actions, named assertions, or other
   flows — and may mix those layers. A flow that just forwards to a single action with nothing
   else is pointless indirection — delete it and call the action directly.

4. **`.data.ts` holds every typed data-shape declaration** — request/response interfaces and
   fixture values alike. Only the literal expected *values* the app produces — error messages,
   status codes — are exempt: those live baked into a named assertion function in
   `.assertions.ts`. A negative test that only overrides one or two fields of an existing
   fixture does **not** get a new named fixture — spread the base fixture and override inline
   at the call site (`{ ...ownerLoginBody, password: '' }`).

   **A UI spec reuses its domain's `-api.data.ts` fixtures rather than duplicating them.** The
   API layer is already the source of truth for what the server returns for a given tenant/role
   — a UI spec asserting the same data rendered as a page just imports it. See
   `memberships/memberships.assertions.ts`'s `assertMembersListVisible`, which takes
   `ExpectedMember[]` straight from `memberships-api.data.ts` (`acmeMembers`) instead of a
   parallel `memberships.data.ts` fixture. A UI-only `.data.ts` (`overview/overview.data.ts`) is
   still correct where there's no API-layer equivalent to reuse — Overview's rendered summary
   doesn't map to one endpoint's response shape.

5. **Reusable utility functions live in `tests/functional/utils/<name>.utils.ts`, not
   duplicated per domain.** `utils/api.utils.ts` holds the API-layer primitives every domain's
   tests build on (`sendApiRequest`, `withHookRequestContext`, `assertResponseStatus`,
   `assertResponseBody`). `utils/env.utils.ts` holds `requireEnv` — extracted here rather than
   left duplicated in both `config/environments.ts` and a domain's `.data.ts`, which is how the
   source framework's version of this rule was actually violated once Meridian needed
   `requireEnv` in more than one place.

6. **Locators are testid-first.** `getByTestId(...)` for element identity — clicks, scoping,
   reading a field's value — falling back to `getByRole` / `getByLabel` only where there's no
   testid, and raw CSS/XPath only as a genuine last resort with a comment. No `data-testid`
   exists anywhere in `apps/web` yet, so every locator in `overview/overview.assertions.ts` is
   currently in that fallback tier (e.g. `getByLabel('Email')` for the login form, which has no
   testid) — this rule is still binding, it just means add testids to `apps/web` before reaching
   for a raw CSS selector, not that the fallback tier is the norm.

7. **Assertions use `expect.soft(...)`**, not bare `expect(...)`, inside `.assertions.ts` files
   (see `assertResponseStatus` / `assertResponseBody` in `utils/api.utils.ts`), so one run
   surfaces every failing check instead of stopping at the first.

8. **Assertions match exactly once the full shape is known** — the API-layer and UI-layer forms
   of the same posture, not two different rules. API: `assertResponseBody(..., { exact: true })`
   is the default for anything with a stable, fully-known shape — see every assertion in `auth/`.
   Dynamic fields (a UUID, a JWT, a random hex refresh token) get an asymmetric matcher
   (`expect.stringMatching(...)`) mixed into the same exact-match object, never a reason to drop
   to a partial match. UI: `toHaveText(...)` against the full, exact
   expected text, not `toContainText(...)`'s partial/substring match, once that text is fully
   known — see `overview/overview.assertions.ts`, including two-cell table rows whose exact text
   is the label directly concatenated with the value (no whitespace between adjacent `<td>`s in
   the JSX). A partially-dynamic text node (a computed percentage, a timestamp) gets an *anchored*
   regex (`^...$`) passed to `getByText(...)`/`toHaveText(...)` — unanchored, `getByText` matches
   on any substring, which is the DOM equivalent of silently dropping to a partial match.

9. **Every `test.describe(...)` tags every folder level, not just the immediate one** —
   **this is a deliberate deviation from the source framework**, which tags only the innermost
   folder. `auth/login/login-api.spec.ts` tags `['@auth', '@login', '@api']`, not just
   `['@login', '@api']`, so the whole `auth` domain and just its `login` sub-feature can each be
   run independently (`--grep @auth` vs `--grep @login`). **Every spec also carries a layer tag —
   `@api` for the `-api` file set, `@ui` for anything else** (`overview/overview.spec.ts` tags
   `['@overview', '@ui']`) — so the (fast, no browser) API suite and the (slower, browser-driven)
   UI suite can each be run independently of the other, the same reasoning as the `@auth`/`@login`
   split above. **Error specs add `@error` on top** — `['@auth', '@login', '@api', '@error']` —
   another addition not in the source framework, so the full error-path suite can be run in
   isolation (`--grep @error`) as its own CI phase or quick sanity check. **A spec whose tests
   write shared domain data — create, edit, delete, or
   anything else that mutates real server-side data rather than only reading it — also carries
   `@mutating`** (the source framework has this same tag, on this same rule): `['@memberships',
   '@api', '@mutating']` in `memberships-create-api.spec.ts`. Tag the whole `describe` block even
   if only one test in it can actually write data — e.g. an otherwise all-403 `-error.spec.ts`
   with one assumption-test that currently succeeds because of a real implementation bug (see
   `memberships-create-api-error.spec.ts`) — since CI schedules by file/describe, not by
   individual test.

   **Every domain that needs `@mutating` coverage gets its own dedicated scratch tenant(s) and
   users — never a tenant any non-mutating spec also asserts against, and never shared with
   another domain's mutating tests.** This is what actually prevents a create/delete from racing
   a concurrently-running list/count assertion, or one mutating domain's writes from racing
   another's on the same tenant row or audit log — a worker can leave a row transiently visible
   mid-write, and reseeding between full runs (`global.setup.ts`) doesn't help *within* one run.
   Naming convention: tenant `name`/`slug` is `<domain>-mutating` (e.g. `memberships-mutating`);
   users are `<domain>-owner@mutating.test` / `<domain>-admin@mutating.test` (e.g.
   `memberships-owner@mutating.test`) — `.test` rather than `.com`, matching every other seeded
   email in `scripts/seed.js` (`.test` is the IANA-reserved TLD for exactly this, guaranteed to
   never resolve to a real domain). A shared `@mutating.test` suffix across every domain's users
   makes a scratch user identifiable as scratch at a glance; the `<domain>-` prefix says which
   domain owns it. A domain needing more than one scratch tenant (A1's rate-limit override: one
   per plan tier, since the override ceiling is plan-dependent) extends the pattern to
   `<domain>-mutating-<qualifier>` (`rate-limit-mutating-free/growth/scale`) — the users stay
   shared across that domain's own tenants (`rate-limit-owner@mutating.test`), since they're all
   the same domain's scratch data. Because isolation now lives in the *data* (each mutating spec only ever
   touches its own scratch tenant), the suite runs as a single `playwright test` invocation —
   no phase split, no separate `mutating`/`non-mutating` projects. `@mutating` is kept purely as
   a selective-run filter (`--grep @mutating` to run only mutating specs, `--grep-invert
   @mutating` for a fast read-only smoke check), not because CI requires it.

   **Every domain that needs `@mutating` coverage gets its own dedicated scratch tenant(s) and
   users — never shared with another domain's mutating tests.** `@mutating` phase-isolates
   mutating specs from non-mutating exact-match reads (above), but says nothing about two
   *different* mutating domains racing writes against the same tenant row or audit log if they
   shared one — the same class of problem from the opposite direction. Naming convention: tenant
   `name`/`slug` is `<domain>-mutating` (e.g. `memberships-mutating`); users are
   `<domain>-owner@mutating.test` / `<domain>-admin@mutating.test` (e.g.
   `memberships-owner@mutating.test`) — `.test` rather than `.com`, matching every other seeded
   email in `scripts/seed.js` (`.test` is the IANA-reserved TLD for exactly this, guaranteed to
   never resolve to a real domain). A shared `@mutating.test` suffix across every domain's users
   makes a scratch user identifiable as scratch at a glance; the `<domain>-` prefix says which
   domain owns it.

10. **`test.describe.configure({ mode: 'serial' })`** whenever tests depend on state left by
    earlier tests in the same file. Inter-test dependency without serial mode is a bug waiting
    to happen under parallel execution.

11. **Every UI interaction is followed by a deterministic wait** — a specific locator/state
    (`await expect(locator).toBeVisible()`, `await expect(page).toHaveURL(...)`),
    `page.waitForLoadState(...)`, or `page.waitForResponse(...)` armed *before* an action that
    fires an API call. **Never `page.waitForTimeout(...)` or any hardcoded sleep.** See
    `auth/login/login.actions.ts`'s `goToLogin` (waits for the app's own client-side redirect to
    `/login` via `toHaveURL`) and that same file's `waitForOverviewPage` (waits for the
    post-login redirect to `/dashboard` via `toHaveURL`, then `networkidle` for the Overview
    page's own data fetches) — composed into `login.flow.ts`'s `loginViaUi` rather than inlined
    there, per rule 2/3.

12. *(Reserved — the source framework's rule 12 was cart/order-specific and doesn't apply to
    Meridian's domain. Numbering kept stable rather than renumbering every rule below.)*

13. **Test titles read as `'validate user can/cannot <do something>'`**, or for a specific role,
    `'validate <role> user can/cannot <do something>'` — see every test in `auth/`.

14. **Base URL comes from `tests/functional/config/environments.ts`; credentials/fixture data
    come from the domain's own `.data.ts` via `requireEnv(...)`** — never a hardcoded URL in a
    test. **`API_BASE_URL` is the bare host with no `/api/v1`, and needs a trailing slash** —
    two things the source framework didn't need to handle, both Meridian-specific:
    - `main.ts` applies `api/v1` as a global prefix *except* `/health`
      (`app.setGlobalPrefix('api/v1', { exclude: ['health'] })`) — baking the prefix into the
      shared base URL would make `/health` unreachable through it, and would break a future
      `/api/v2` route the same way. The prefix lives in each `.actions.ts` request URL instead
      (`'api/v1/auth/login'`).
    - Playwright's `APIRequestContext` resolves a relative request URL against `baseURL` via
      the WHATWG URL algorithm, which silently drops path segments unless the base URL has a
      trailing slash **and** the request URL has no leading slash. Get either wrong and
      `/api/v1` (or the whole path) vanishes from the resolved URL with no error, just a 404.

15. **A request-making flow always asserts the response status; whether it also asserts the
    body depends on what the flow is for.** A flow that sends a request confirms it with
    `assertResponseStatus(...)` before anything reads the body. A flow that exists to check
    something asserts the body through the domain's named assertions; a flow that only prepares
    or tears down test data (`generateAccessToken`, `generateRefreshToken`,
    `terminateRefreshToken`) stops at the status check.

16. **Names state exactly what the thing is, holds, or returns.** Rename the moment a name
    stops fitting.

17. **An authenticated API spec logs in once per file, in `beforeAll`**, via
    `withHookRequestContext` (`utils/api.utils.ts`), when a test needs a token but isn't itself
    testing login. Not yet exercised anywhere, including `auth/` itself — its specs mint a
    fresh actor per test via the `request` fixture directly, since testing login/logout/refresh
    doesn't presuppose an existing session. Binding once another domain's tests need an
    authenticated actor to test something that isn't auth.

18. **Navigate through the UI, not the URL bar — `page.goto` is only for the one true entry
    point.** Every other page is reached the way a real user reaches it, not
    `page.goto('/some-path')` — jumping straight to a URL skips navigation a test could otherwise
    catch breaking (a moved link, a broken redirect) and skips that navigation's own deterministic
    wait (rule 11). Meridian's entry point is the app's actual root: `auth/login/login.actions.ts`'s
    `goToLogin` does `page.goto(environment.webBaseUrl)` (Home, `apps/web/app/page.tsx`) and then
    waits for *that page's own* client-side redirect to `/login` — it does not `page.goto('/login')`
    directly. This is a deliberate adaptation, not a literal copy, of the source framework's
    version of this rule (whose app has an actual clickable "sign in" link on its home page to
    click through instead) — Meridian's Home has no clickable link at all, only a redirect based
    on session state, so landing on `/login` via that redirect is this app's equivalent of "the
    way a real user reaches it." `goToLogin` lives in `auth/login/` (not the domain that happens
    to use it first) for the same reason `generateAccessToken` does — rule 23.

19. **An assertion that already exists gets composed, not re-derived.** Before writing a new
    named assertion, check whether an existing one — in the same file, a sibling feature file in
    the same domain, or another domain's `.assertions.ts` — already checks some or all of the
    same conditions, and call it instead of re-asserting the same checks.

20. **RBAC/permission tests are not centralized in one `auth/` or `rbac/` folder.** `auth/`
    proves *who* you are (authentication). *What you're allowed to do* (authorization, per
    `docs/rbac-matrix.md`'s role × capability table) is enforced per-endpoint via `@Roles(...)`
    + `RolesGuard` inside each domain's own controller — so the tests proving that enforcement
    belong in that domain's own `-error.spec.ts` (a permission denial is a 403 error-path
    scenario), not bolted onto auth. The role × endpoint × tenant matrix (Part B) is the sum of
    these per-domain error tests, not one centralized file.

21. **Error spec test ordering: invalid input before blank/missing input**, consistently,
    across every `-error.spec.ts` — e.g. `login-api-error.spec.ts`'s order is invalid email,
    invalid password, blank email, blank password.

22. **`.gitkeep` placeholders are deleted the moment a folder gets its first real file** — never
    left alongside real content once a domain folder is no longer empty.

23. **Flow functions exist for reuse across domains, not just within their own folder.**
    `generateAccessToken` / `generateRefreshToken` / `terminateRefreshToken` in `auth/` are
    unused *within* `auth/`'s own success specs but are exactly what every other domain's
    `beforeAll` needs to get an authenticated actor or a token to manipulate — not dead code
    just because nothing in the same folder calls them yet.
