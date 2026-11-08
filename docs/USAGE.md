# Local usage (early prototype)

Requires Node 22+ and a desktop Windows/macOS/Linux machine that can display a Chromium window.

~~~sh
npm install
npx playwright install chromium
npm start -- --setup
npm start
npm start -- --execute
~~~

- \`--setup\`: opens Humble and Steam for **manual** sign-in; press Enter in the terminal after login.
- No flags: reads the Humble Keys & Entitlements page and lists Steam-labeled rows in **dry-run** mode. Does not reveal or activate.
- \`--execute\`: reveals unambiguous Steam keys and submits them one at a time on Steam. A verified success is checkpointed locally. Any failure, unknown result or rate-limit condition stops the batch.
- Browser session and checkpoint stay in local ignored \`data/\`. Do not share this folder or saved HTML containing keys/cookies.
- Restart after interruptions; only a confirmed Steam activation is skipped. Do not treat \`already used\` as successful activation.
- Complete account sign-in and handle CAPTCHA manually; the tool cannot bypass them.

## Limitations to validate before real activation

The source HTML ZIPs shared in the earlier conversation were not available during repository seeding. This prototype uses conservative DOM selectors for Humble key rows and Steam's product activation form; **do not assume live compatibility** until redacted sample HTML and one-key validation have been completed. Dynamic pagination, nonstandard key formats, bundles with multiple keys per row, and transient AJAX success/error rendering need fixture-based testing. No network request or activation has been performed in this environment.

## Offline browser regression coverage

CI installs Chromium headless shell and exercises synthetic Humble reveal and intercepted Steam activation forms. These tests make **no real Humble/Steam requests** and are not a substitute for checking the saved real-page HTML or doing a supervised one-key validation.
