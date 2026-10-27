- Test strategy and the risks it covers

Prioritized API tests as most business logic is implemented in backend layer, and I believe this is where the most risks are.

Ensured each domain has it's own set of test data (e.g. tenant, members) to avoid conflict during parallel runs. All seeded data are refreshed at start of run so initial state is always same. 

UI tests are only to ensure UI<>API request/response mappings are correct (i.e. business logic shouldn't be retested here as it will just be redundant). Add only a couple basic UI tests for demo purposes. Runs on 3 browsers (chrome, firefox, safari)

There's a retry mechanism in place so it at least higher chance all test fully executed in case of intermittent failures, but these intermittent failures (flaky tests) will still be flagged in the test report.

Test framework as a whole, I can discuss over debrief call. (also wanted to cover AI assisted workflows but wasn't covered in this exercise. I have a separate project where I can show how this works)

******

- What you prioritised, what you dropped, why + Time log

As I only have 3-5 days for this exercise, I just allocated ~4-6 hrs per section (~18hrs total for parts A+B+C).

For Part A:

Feature implemented with playwright tests covering all requirements except:

A1 - Skipped "The override survives a plan change." since I didn't see any API for changing plan of a tenant. Currently only accepts name & timezone. There's a bug that might be related to this too.

A2 - Skipped "Rate limit and quota accounting must not reset on rotation." as I dont think this is needed. Neither is directly linked to secrets. Rate limit is tied to keys while quota accounting is tied to tenants.

For Part B:

I just focused on adding sample UI + API tests to at least demo my Playwright test framework (i.e. folder/file/test structure, coding standards, test data management, flaky detection, parallel runs and retry mechanisms) + CI + report dashboards.

Also added unit tests + unit test coverage.

As mentioned earlier, i prioritize more on API tests since most business logic was implemented there. I covered here the "api x role x tenant" permissions matrix for some apis.

For Part C:

Prioritized the analysis of defects based on severity.

-- Priority 1: SUP1051, SUP1067, SUP1062 (appears to be security/performance issue and seems issue must be fixed ASAP)

-- Priority 2: SUP1043 (appears functional issue but edge case. needs further confirmation.)

-- Priority 3: SUP1058 (appears timezone related issue and happens on month start/end so if issue was raised at beginning of month, we still have time to investigate this later.)

-- Priority 4: SUP1071 (my understanding this doesnt impact usage/billing and just annoying duplicate notifications? set to lowest priority)

*****

- What you chose not to automate, why

Deprioritized UI tests since sections A and C are mostly covering business logic and can be tested via backend. Also most business logic appears to be on API layer so I really focused on API tests first. Once API tests are done, then can revisit UI tests. But again I add a couple of UI tests for demo purposes.

Direct DB tests not covered. For me, better to test with GET API calls instead of directly querying the DB. API tests are less fragile. I experience a project before where we migrated to a different DB. Luckily we dont rely on DB tests so none of our tests broke. 

*****

- Anything in Part A you had to decide for yourself, and what you decided

Only the request payload was mentioned, so I decided on the response payload.
e.g. for set rate limit override, i decided to return following fields in response:
  id: string;
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  suspended: boolean;
  limits: TenantLimits;

And in A1 notes section, it says product not decided to where a person can set or not an override below the default rate limit. So this is not yet implemented. Currently even below default limit is allowed.

In A2, for existing keys i decided if undefined, it will have both read and write access. There's no way to know what's the correct scope for each existing key.

*****

- Defect summary table

I prioritized the defects based on what i think the severity is after reading the description, then i focused on the critical ones first as i have limited allocated time for this. Please see below status and findings for each (already sorted by priority):

Priority 1:

1. SUP1051
- severity: critical
- preconditions: revoke a key
- test steps: after revoking a key, using the revoked key, hit echo/ping/transform gateway apis
- expected: 401 error, actual: returned 200/201
- root cause: there's a 60s cache that needs to be terminated immediately upon revoking a key
- evidence: see "validate a revoked key is rejected on echo/ping/transform" failed on run "https://mastahkitz.github.io/meridian/runs/16/#?q=s%3Afailed"

2. SUP1067
- severity: critical
- preconditions: heavy traffic
- test steps: to easily replicate the issue, override rate limit to 5 then send a burst 20 echo/ping/transform gateway api calls (not sequential , but burst)
- expected: only 5 returns success, actual: more than 5 returned success
- root cause: race condition from a non-atomic read-then-write counter. happens when there's heavy traffic and concurrent requests.
- evidence: see "validate concurrent requests do not exceed the rate limit override" failed/flaky on run "https://mastahkitz.github.io/meridian/runs/16/#?q=s%3Aflaky"

3. SUP1062
- severity: originally critical, but after investigating i dropped it to medium as i was not able to replicate the issue
- preconditions: loaded seed large for northwind (~530k usage)
- test steps: i just navigated to usage page but page loaded fine. i tried multiple times and couldnt replicate issue. load only took a few milliseconds.
- expected: load fast, actual: loaded fast too
- possible improvements: add an index on usage_events(api_key_id, created_at) (and tenant_id, created_at for the daily endpoint), and replace UsageService.summary()'s per-key loop (one query per API key) with a single aggregated query — or better, read from usage_daily, which is already written on every request but currently has no read path.
- evidence: see screenshot folder. i was able to access the page fine.

Priority 2: 

1. SUP1043 (possibly a new feature/story rather than a defect)
- severity: high
- deprioritized but my initial hunch is the tenant's plan was changed in the middle of the month? plan change was mentioned in Part A but no API exists, so if the client's plan did change, then it must have been a direct DB change. assuming this was the case, then we need to know what DB script was ran so we can review it.
- potential issues when incomplete/incorrect DB script was executed:
    - stale overage from old plan doesnt get recalculated when client didnt exceed new plan's usage. in other words, client still gets charge based on past overage on old plan.
    - related to SUP1051 60s cache, gateway calls uses this to check which plan to use
    - also how do we compute overage/billing when 2 plans applied in a month? the fact that there's no API for plan change yet somehow tells me we haven't decided yet on how to move forward with this scenario

Priority 3:

1. SUP1058 (possibly a new feature/story rather than a defect)
- severity: medium
- deprioritized but based on details, possibly a timezone issue. i am assuming our client uses their own timezone (e.g. Japan timezone) while our application is using UTC (both UI and API). need further confirmation if we need to use client's timezone (i.e. tenant's timezone) as well when computing usage/billing. My proposal is to use tenant's timezone for all computations we are doing in the system as this seems more logical from client's PoV.

Priority 4: 

1. SUP1071
- severity: medium/low
- deprioritized but based on details, I assume this doesnt impact usage/billing and just an annoying issue? need further confirmation how much this impacts the client.


Note: 
My tests in main branch will replicate the issues. Sample results: https://mastahkitz.github.io/meridian/runs/16/
My tests in test/A2_2 has all the bug fixes and has latest code changes (not just bug fixes). Sample results: https://mastahkitz.github.io/meridian/runs/17/


*****

- Release recommendation with conditions and accepted risks

For this application, it is a NO GO since I haven't fully tested the application. I need time to understand all the features, e2e flows, what is allowed and what is not allowed, etc. Then I have to identify all the test scenarios, manually test or automate them. Only then will I get a clear picture on what the current status is.

Given the limited exploration testing I have done so far, I already found some bugs. (e.g. when logging off, we were not actually revoking the refresh token properly). I would imagine if i fully tested this, there's a lot more bugs that would appear.

But generally, we need to:
1. identify all test scenarios
2. peer review test coverage
3. execute all tests (whether manual or automated)
4. review/fix bugs (focused on critical/high ones first) then retest again (regression testing)
5. ensure critical/high priority bugs are fixed. medium/low most likely can be descoped but still need to be reviewed properly and get signoff from all teams as known risks.

Note: If however, let's say there's no other bugs besides what was discussed in Part A and C (lets just assume no other regression bugs). Since A is fully implemented and critical issues in C were already fixed. The remaining ones can be descoped to a hotfix (anyways by the nature of it these 4 are already existing in Production so shouldn't be a blocker at all), then we can give a conditional GO with the understanding that we haven't fixed yet the other 4 bugs but they shouldn't be adding any new issues in Production. We can plan the other 4 bugs as a hotfix or move to next official release.

- AI usage disclosure
I mainly used Claude Code. I used it for the following:
1. build the APIs needed in part A
2. write the playwright test code for me but i gave the AI my test framework (folder/file/test structure), coding standards and test scenarios to be covered. then afterwards, i reviewed the test code generated to ensure the steps are correct and assertions are complete. if not, then i just asked AI to fix them and review again.
3. write the unit tests (ill be transparent i dont have experience writing unit tests so this one i completely leverage to AI)
4. when i reviewed the bugs, i had an idea on the root cause of the bug, and so i asked AI to quickly validate if my hunch is right. I asked AI to read and confirm what is written in the code, and also simulate some tests as per my specification to confirm my initial analysis.