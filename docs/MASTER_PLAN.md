# Master Plan — Humble Claim

## Goal
Process the owner's Humble Bundle **Keys & Entitlements** page, reveal available Steam product keys, and activate eligible keys in the owner's Steam account with an observable, restartable local workflow.

## Constraints
- Use semantic DOM locators and a persistent **visible** Playwright Chromium profile; OCR only if DOM extraction proves inadequate.
- Never ask for account passwords, store cookies in Git, or circumvent CAPTCHA, sign-in, rate limits, anti-bot controls, or activation policies.
- Default to inspection/dry-run. An explicit `--execute` flag authorizes reveals and Steam submissions.
- No plaintext key logs or persisted key values. Persist only SHA-256 key fingerprints and result statuses in local ignored state. The current key exists only in process memory until submission.
- Never mark keys activated without confirmed Steam feedback. Deduplicate, retry cautiously, and stop on blocked/restricted results.
- Maintain tests for parsing, confidence, status classification, checkpoint safety, and scenario failures. No unverified selectors should be represented as production-ready.

## Milestones
1. [ ] **Baseline automation and CI:** CLI, browser session, Humble DOM extraction, Steam activation helper, fingerprint checkpointing, tests, GitHub Actions. Implement behind `--execute`; do not claim live compatibility without matching archived HTML.
2. [ ] **Real-page selector verification:** Obtain previously shared `pages.zip` and `active on steam.zip` archives (currently unavailable), create redacted fixtures, verify revealed/unrevealed/claimed/expired states, pagination, and Steam errors.
3. [ ] **End-to-end safety and UX:** Manual login handoff, dry-run summary, resumability, pacing, retries, hard stops, and explanatory error reports.
4. [ ] **Human validation:** Real-session dry run, opt-in single-key activation, then all-keys batch. Must confirm no duplicates and accurate success evidence.

## Architecture
- Node.js 22+, native ESM and `node:test`; Playwright Chromium for visible browser automation.
- `src/` for parsing, orchestration and browser adapters; `test/` for fake browser/HTML tests.
- `data/` ignored for persistent browser state/checkpoints; no server and no cloud credentials.

## CI-Pipline protocol
- `main`: production; `dev`: integration.
- One Issue = one `work/<issue>-slug` branch from `dev` = one PR into `dev`.
- Merge only after every applicable required GitHub Actions job succeeds. Zero or missing checks is **not** green.
- PRs have Result, Implementation, Verification, Risk, Remaining work, and `Refs #<issue>`.
- Control Issue tracks the current item and merges; reserve direct commits to `main`/`dev` for initial repository seeding.

## Current blockers/known unknowns
The saved Humble and Steam HTML archives referenced in the project chat are not accessible in this continuation. DOM selectors must be validated using those archives and current logged-in pages. Steam page UX and rate-limits may change. Any authentication, CAPTCHA, account restriction or ambiguous activation response requires stopping for user handling, not bypassing it.
