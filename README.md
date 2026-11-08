# Humble Claim

A local browser automation project for processing **your own** Humble Bundle Keys & Entitlements and, when enabled, activating eligible Steam product keys.

## Current status

Early implementation. The original saved Humble and Steam HTML archives have not been recovered in this repository, so live-page selectors and end-to-end activation require verification with representative HTML fixtures. The project does not bypass sign-in, CAPTCHA, rate limits, or Steam activation restrictions.

## Workflow

1. Launch a visible, persistent Playwright Chromium profile.
2. Sign in to Humble and Steam yourself; sessions remain on your machine.
3. Inspect the Keys & Entitlements page without changing it.
4. Explicitly opt into reveal/activation. Process keys one by one with checkpoints and masked logs.
5. Review any ambiguous, failed, or non-Steam entitlement manually.

See [the master plan](docs/MASTER_PLAN.md) on the development branch for milestones.

## Security

Do not commit saved pages containing product keys, session cookies, browser profiles, or account secrets. Only masked identifiers or one-way fingerprints should be written to local checkpoints.
