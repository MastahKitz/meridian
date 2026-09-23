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
   `AuthController`. This is a deliberate call for `auth` specifically, not a rule that every
   multi-route controller needs subfolders — a controller whose routes are only ever exercised
   together stays flat.

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

5. **Reusable utility functions live in `tests/functional/utils/<name>.utils.ts`, not
   duplicated per domain.** `utils/api.utils.ts` holds the API-layer primitives every domain's
   tests build on (`sendApiRequest`, `withHookRequestContext`, `assertResponseStatus`,
   `assertResponseBody`). `utils/env.utils.ts` holds `requireEnv` — extracted here rather than
   left duplicated in both `config/environments.ts` and a domain's `.data.ts`, which is how the
   source framework's version of this rule was actually violated once Meridian needed
   `requireEnv` in more than one place.

6. **Locators are testid-first** for any UI layer built later (`getByTestId(...)`), falling
   back to `getByRole` / `getByLabel` only where there's no testid, and raw CSS/XPath only as a
   last resort with a comment. Not yet exercised — no UI tests exist yet — but binding for when
   `overview/` and any other E2E work starts.

7. **Assertions use `expect.soft(...)`**, not bare `expect(...)`, inside `.assertions.ts` files
   (see `assertResponseStatus` / `assertResponseBody` in `utils/api.utils.ts`), so one run
   surfaces every failing check instead of stopping at the first.

8. **Assertions match exactly once the full response shape is known.** `assertResponseBody(...,
   { exact: true })` is the default posture for anything with a stable, fully-known shape — see
   every assertion in `auth/`. Dynamic fields (a UUID, a JWT, a random hex refresh token) get an
   asymmetric matcher (`expect.stringMatching(...)`) mixed into the same exact-match object,
   never a reason to drop to a partial match.

9. **Every `test.describe(...)` tags every folder level, not just the immediate one** —
   **this is a deliberate deviation from the source framework**, which tags only the innermost
   folder. `auth/login/login-api.spec.ts` tags `['@auth', '@login', '@api']`, not just
   `['@login', '@api']`, so the whole `auth` domain and just its `login` sub-feature can each be
   run independently (`--grep @auth` vs `--grep @login`). **Error specs add `@error` on top** —
   `['@auth', '@login', '@api', '@error']` — another addition not in the source framework, so
   the full error-path suite can be run in isolation (`--grep @error`) as its own CI phase or
   quick sanity check.

10. **`test.describe.configure({ mode: 'serial' })`** whenever tests depend on state left by
    earlier tests in the same file. Inter-test dependency without serial mode is a bug waiting
    to happen under parallel execution.

11. **Every UI interaction is followed by a deterministic wait** — never a hardcoded sleep. Not
    yet exercised (no UI tests yet), binding for later E2E work.

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

18. **Navigate through the UI, not the URL bar**, for any UI layer built later. Not yet
    exercised — no UI tests yet.

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
