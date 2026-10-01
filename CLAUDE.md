# CLAUDE.md

Guidance for Claude Code when working in this repository. Full documentation: `README.md`.

## Project

Playwright Test (JavaScript, CommonJS) automation for a retail / POS web app (Frappe-based).
Two areas of the app are tested:

- **Desk** (back office): `BASE_URL/app/...` – login, Retail workspace, POS Terminal, Gift Card, POS Invoice
- **POS** (point of sale): opens in a **new tab** from the POS launcher link on the Retail page (`app/pos-interface`)

## Commands

```bash
npm run regression              # all tests on Chrome (default browser)
npm run giftCardTest            # Web E2E spec only
npm run webAndApiTest           # Web + API spec only
WORKERS=2 npm run regression    # parallel, one POS terminal per worker
npx playwright test --list      # check that every spec loads (no app needed)
```

- `.env` (copy of `.env.example`) must hold `APP_USERNAME`, `APP_EMAIL`, `APP_PASSWORD`, `POS_API_MODULE`; `BASE_URL` defaults to `http://localhost:8080/`.
- After a run, the report is at `reporting-labs/index.html`; failure traces are in `test-results/`.

## Layout

| Path | Role |
|------|------|
| `tests/auth.setup.js` | `setup` project: tests the login page, saves the session to `playwright/.auth/user.json` |
| `tests/WebE2ETestPageManager.spec.js` | Web E2E, serial: gift card sale in POS, verified in Desk |
| `tests/E2EUsingWebAndAPI.spec.js` | Web + API: API binds terminal / opens shift / sells, UI verifies |
| `pageObjects/BasePage.js` | parent of every page object: `open()`, `verifyPageLoaded()`, `this.wait`, `navigateTo()` |
| `pageObjects/PageManager.js` | factory for all page objects (one manager per browser tab) |
| `pageObjects/*.js` | one class per screen / popup |
| `fixtures/testFixtures.js` | `pm`, `apiUtils`, `terminalName`, `env`, `posData` fixtures |
| `utils/APIUtils.js` | Frappe API calls (login/logout, terminal, shift, sale) |
| `utils/WaitUtils.js` | waits for late-rendering UI (`this.wait` in page objects) |
| `utils/TerminalPool.js` | `getTerminalForWorker(testInfo)` – one terminal per worker |
| `config/env.js` | `ENV` – base URL, credentials (getters), `authFile` |
| `testData/posData.json` | terminals, gift card, opening entry, item sale data |

## Conventions

Follow the existing code; the project skills describe the patterns in detail:
- **create-page-object** (`.claude/skills/create-page-object/SKILL.md`) – new locators / page objects
- **create-test-script** (`.claude/skills/create-test-script/SKILL.md`) – new specs and test logic

Key rules:
- **Page objects** `extends BasePage`, call `super(page)`, set `this.path` (or leave `null` for screens without a URL) and override `verifyPageLoaded()`. Register every new page object in `PageManager`.
- **Locators** are declared in the constructor under `// ── Locators ──` comments. Prefer `getByRole` / `getByText`; use the app's stable attributes otherwise (`[data-fieldname=…]`, `[id='page-List/<DocType>/List']`, `smart-*` / `ivend-*` components). Data-dependent locators are methods (`posTerminalByName(name)`).
- **Specs never contain selectors.** They call page objects through `PageManager` or fixtures.
- **No `waitForTimeout()`.** Use `this.wait` (WaitUtils): `isVisibleWithin()` for optional elements, `waitForText` / `waitForValue` for late values, `waitForDomToSettle()` after re-rendering.
- **Test data** goes in `testData/posData.json`; environment values come from `ENV` (never hard-code URLs or credentials).
- **Comments**: a `/** … */` header on every file explaining its purpose, `// ── Section ──` dividers, short JSDoc on public methods.
- **Tags**: every test has `@web` and/or `@API`; `auth.setup.js` carries both so filtered runs still log in.
- **Reports**: start each test with `meta({ priority, severity, feature, owner })` from `reporting-labs`; group steps with `test.step()`.

## Gotchas (learned the hard way)

- **Session limit**: the test user may have only **2 sessions at once**. A third login makes Frappe end the *oldest* one – the saved storageState – and every UI test then shows "Not Permitted". So: `apiUtils` logs out after each test; never call `HomePage.logoutFromApplication()` with the saved session; don't log in as the test user elsewhere during a run.
- **Shared terminals**: a terminal bound to one browser (`hardware_id`) disappears from the POS dropdown for every other browser. Always get the terminal from `getTerminalForWorker(testInfo)` / the `terminalName` fixture, and **release it** when done (`PosTerminalListPage.releaseTerminal()`).
- **Workers ≤ terminals**: `WORKERS` may not exceed `posData.json → terminals.length`.
- **API session ≠ browser session**: `APIUtils` logs in on its own. The browser's UI session carries a CSRF token that API POSTs would need; for `submit_pos_invoice` the token is read from the page (`getCsrfTokenAfterLoggedIn`).
- **POS start-up**: the terminal popup can take seconds to render; the opening-amount popup only appears for a new shift. Page objects already handle both – reuse them.
- **WebKit**: the POS app crashes on WebKit at start-up (app bug). Both POS specs are `test.fixme` on WebKit; use Chrome.
- **Long flows**: hooks share the 30s test timeout. Use `test.slow()` in long tests and `test.setTimeout()` in long `beforeAll` hooks.
- Every run creates real POS invoices and gift cards in the target environment.

## Verifying a change

1. `npx playwright test --list` – every file loads.
2. `npm run regression` against a running app – all tests pass.
3. For POS changes, also run `WORKERS=2 npm run regression`.

## Do not commit

`.env`, `playwright/.auth/`, `reporting-labs/`, `test-results/` (all git-ignored).
