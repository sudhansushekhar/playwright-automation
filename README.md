# Playwright Automation Framework – Retail POS

End-to-end test automation for a **retail / Point of Sale** web application (Frappe-based), built with [Playwright Test](https://playwright.dev/) (JavaScript, CommonJS).

What the framework combines:

- **Login page test + storageState** – log in once through the real login page, save the session, reuse it everywhere
- **Web E2E** – full UI flows through the **Page Object Model** and a central **PageManager**
- **Web + API E2E** – the API prepares data and makes the sale, the browser verifies the result
- **Custom fixtures** (`pm`, `apiUtils`, `env`, `posData`) via `test.extend()`
- **Environment-driven config** (`.env` locally, GitHub Secrets in CI) and **JSON test data**
- **reporting-labs** HTML report, locally and in CI
- **GitHub Actions** CI (report artifact, job summary, run history, optional GitHub Pages)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Getting Started](#getting-started)
4. [Running Tests](#running-tests)
5. [How a Run Works](#how-a-run-works)
6. [Test Suites](#test-suites)
7. [Configuration](#configuration)
8. [Environment Variables & Test Data](#environment-variables--test-data)
9. [Page Object Model (POM)](#page-object-model-pom)
10. [Custom Fixtures](#custom-fixtures)
11. [API Layer (`APIUtils`)](#api-layer-apiutils)
12. [OOP Concepts Used](#oop-concepts-used)
13. [Wait Utilities (`WaitUtils`)](#wait-utilities-waitutils)
14. [Shared Test Resources](#shared-test-resources)
15. [Reporting](#reporting)
16. [CI/CD – GitHub Actions](#cicd--github-actions)
17. [Best Practices Followed](#best-practices-followed)
18. [Known Issues & Limitations](#known-issues--limitations)
19. [Working with Claude Code](#working-with-claude-code)

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Node.js (LTS)** | Runtime |
| **@playwright/test** `^1.63` | Test runner, browser automation, assertions, API client |
| **reporting-labs** `^0.6.8` | Interactive HTML report with history & trends |
| **dotenv** | Loads `.env` into `process.env` for local runs |
| **GitHub Actions** | Continuous Integration |
| **Browser** | Chromium (`chrome` project, default); WebKit (`safari` project) available |

---

## Folder Structure

```
PlayWright Framework/
├── CLAUDE.md                       # project guide for Claude Code (commands, rules, gotchas)
├── .claude/skills/
│   ├── create-page-object/SKILL.md # skill: locators + page objects in this framework's pattern
│   └── create-test-script/SKILL.md # skill: new specs, API helpers and test logic
│
├── .github/workflows/
│   └── playwright.yml              # CI pipeline
│
├── config/
│   └── env.js                      # BASE_URL + credentials from .env / CI secrets
│
├── fixtures/
│   └── testFixtures.js             # test.extend(): pm, apiUtils, env, posData
│
├── testData/
│   └── posData.json                # terminals (one per worker), gift card, opening entry, item sale
│
├── pageObjects/                    # Page Object Model
│   ├── BasePage.js                 # parent class: navigateTo(), waitForNetworkIdle(), verifyTitle()
│   ├── PageManager.js              # factory: one entry point to every page object
│   │   ── Desk (back office) ──
│   ├── LoginPage.js                # login form, valid / invalid login
│   ├── HomePage.js                 # Desk home, sidebar, user menu
│   ├── RetailPage.js               # Retail workspace, opens the POS tab
│   ├── PosTerminalListPage.js      # release the shared POS terminal
│   ├── GiftCardListPage.js         # filter gift cards, read balance
│   ├── PosInvoicePage.js           # check a POS invoice form
│   │   ── POS (point of sale tab) ──
│   ├── PosTerminalPopup.js         # "Select POS Terminal" popup
│   ├── OpeningAmountPopup.js       # opening shift popup
│   ├── PosDashboardPage.js         # sale screen, quick cash, confirm popup
│   ├── PosDashboardMenu.js         # Action / Customer / Transaction button panels
│   ├── GiftCardSearchPage.js       # gift card sale search
│   └── PaymentDetailsPage.js       # transaction complete / receipt
│
├── tests/
│   ├── auth.setup.js               # login page tests + saves the session (storageState)
│   ├── WebE2ETestPageManager.spec.js   # Web E2E: gift card sale (UI + PageManager)
│   └── E2EUsingWebAndAPI.spec.js   # Web + API E2E: item sale via API, verified in UI
│
├── utils/
│   ├── APIUtils.js                 # API helper (login, terminal, shift, sale)
│   ├── WaitUtils.js                # waits for elements that render / update late
│   └── TerminalPool.js             # one POS terminal per worker
│
├── scripts/
│   └── ci-summary.js               # reporting-labs/report.json → GitHub job summary
│
├── playwright/.auth/user.json      # saved session (generated, git-ignored)
├── reporting-labs/                 # generated HTML report (git-ignored)
│
├── .env.example                    # template for your local .env (.env is git-ignored)
├── playwright.config.js            # projects, timeouts, storageState, reporters
├── reporting-labs.config.ts        # report title, metadata, masking, history
├── reporting-labs.history.json     # run history for trends (generated, git-ignored; CI keeps its own in cache)
└── package.json                    # npm scripts and dependencies
```

### Layered architecture

```
┌──────────────────────────────────────────┐   ┌───────────────────────────────┐
│ tests/*.spec.js, auth.setup.js           │◄──│ testData/*.json, config/env   │  what to test, with which data
└───────────────┬──────────────────────────┘   └───────────────────────────────┘
                │ via fixtures/testFixtures.js or directly
┌───────────────▼──────────────┐   ┌─────────────────────┐
│ PageManager → *Page.js       │   │ utils/APIUtils      │  how to do it (reusable actions)
│   └── extends BasePage       │   │                     │
└───────────────┬──────────────┘   └──────────┬──────────┘
┌───────────────▼─────────────────────────────▼──────────┐
│      Playwright (page, locator, request, expect)        │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js LTS (18+)
- A running instance of the application (default **`http://localhost:8080/`**)
- A test user with POS access and at least one POS terminal from `testData/posData.json → terminals` (default **`CI-CD Terminal`**)

### Install

```bash
npm ci
```

```bash
npx playwright install --with-deps chromium
```

### Configure credentials

Copy the template, then fill in your values (`.env` is git-ignored):

```bash
cp .env.example .env
```

---

## Running Tests

| Script | What it runs |
|--------|--------------|
| `npm run regression` | Everything on Chrome (login setup + both specs) |
| `npm run giftCardTest` | Login setup + Web E2E (gift card) on Chrome |
| `npm run webAndApiTest` | Login setup + Web + API E2E on Chrome |
| `npm run webTests` | Tests tagged `@web` on Chrome |
| `npm run APITests` | Tests tagged `@API` on Chrome |
| `npm run regression:safari` | Everything on WebKit (see [Known Issues](#known-issues--limitations)) |

The login setup always runs first because both browser projects depend on it.

Other useful commands:

```bash
npx playwright test --project=chrome --ui
```

```bash
npx playwright test --project=chrome --debug
```

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

Open the report after a run (Windows):

```bash
start reporting-labs/index.html
```

---

## How a Run Works

```
npm run regression
│
├─ project "setup"  (tests/auth.setup.js)
│    login page renders → valid login → Desk home → save session to playwright/.auth/user.json
│
└─ project "chrome"  (starts every browser context from that saved session)
     ├─ E2EUsingWebAndAPI.spec.js      API + UI item sale
     └─ WebE2ETestPageManager.spec.js  UI gift card sale (TC-01, TC-02)
```

- **Only `auth.setup.js` logs in through the UI.** Every other browser context starts with `storageState: playwright/.auth/user.json`, so the specs begin directly on Desk.
- **The API layer has its own session.** `apiUtils` logs in through `api/method/login` and logs out after the test (see [Shared Test Resources](#shared-test-resources)).
- **One terminal per worker.** Default is 1 worker; `WORKERS=2` runs the two spec files in parallel, each on its own terminal (see [Shared Test Resources](#shared-test-resources)).

---

## Test Suites

### `tests/WebE2ETestPageManager.spec.js` – Web E2E (`@web`)

Gift card sale done completely in the UI, with one `PageManager` per tab.

```
beforeAll   new context from storageState → release terminal → Desk home → Retail
            → open POS tab → select terminal → opening amount (new shift only) → "Sale" mode
TC-01       Gift Card button → search & add gift card → quick cash → capture invoice no.
TC-02       Desk › Gift Card list → filter by POS Invoice = invoice from TC-01
            → open gift card → balance > 0
afterEach   on failure: reload POS, void the open transaction
afterAll    release the terminal, close the context (no logout: it would end the shared session)
```

Uses `test.describe.serial` (TC-02 needs TC-01's invoice number), `test.step()` blocks for readable reports, and `meta()` for priority / feature / owner.

### `tests/E2EUsingWebAndAPI.spec.js` – Web + API E2E (`@API` `@web`)

The API does the work, the browser checks it. Uses the fixtures `page`, `pm`, `apiUtils`, `posData`.

| Step | Layer | What happens |
|------|-------|--------------|
| 1 | API | Bind the terminal to a new `hardware_id`, make sure a shift is open |
| 2 | UI | Put `hardware_id` in localStorage → Desk home → Retail → POS opens **straight into Sale mode** (no popups) |
| 3 | API | Submit a POS invoice; assert customer, item, qty, payment, totals in the response |
| 4 | UI | Desk › POS Invoice: title, customer, grand total, status not Draft |
| afterEach | UI | Release the terminal |

---

## Configuration

### `playwright.config.js`

| Setting | Value | Why |
|---------|-------|-----|
| `timeout` | `30s` | Per test; long flows use `test.slow()` (×3) or `test.setTimeout()` |
| `expect.timeout` | `10s` | Auto-wait for web-first assertions |
| `workers` / `fullyParallel` | `WORKERS` (default `1`) / `false` | One POS terminal per worker; tests in a file run in order |
| `retries` | `2` on CI, `0` locally | Absorb flakiness on CI only |
| `forbidOnly` | `true` on CI | A forgotten `test.only` fails CI |
| `use.baseURL` | `BASE_URL` | No hard-coded URLs |
| `use.headless` | `true` on CI, `false` locally | Runners have no display |
| `use.storageState` (chrome, safari) | `playwright/.auth/user.json` | Start logged in |
| `reporter` | `list` (local) / `github` (CI) + `reporting-labs` | Console or annotations, plus HTML report |

### Projects

| Project | Runs | Depends on | Screenshot | Trace |
|---------|------|-----------|-----------|-------|
| `setup` | `*.setup.js` on Chromium | – | – | `retain-on-failure` |
| `chrome` | `*.spec.js` on Chromium | `setup` | `only-on-failure` | `retain-on-failure` |
| `safari` | `*.spec.js` on WebKit | `setup` | `on` | `retain-on-failure` |

---

## Environment Variables & Test Data

### `config/env.js`

| Variable | Used for | Default |
|----------|----------|---------|
| `BASE_URL` | Application URL | `http://localhost:8080/` |
| `TEST_ENV` | Environment label in the report | `local` |
| `APP_USERNAME` | UI login | **required** |
| `APP_EMAIL` | API login, opening entry user | **required** |
| `APP_PASSWORD` | Password | **required** |
| `POS_API_MODULE` | Server module of the POS API (`api/method/<module>.api…`) | **required** for API tests |

Credentials are getters: a missing value fails only the test that needs it, with a clear message, and never breaks test discovery.

```js
const { ENV } = require('../config/env')
await loginPage.validLogin(ENV.username, ENV.password)
```

### `testData/posData.json`

Terminal name, opening amount, gift card item and filter, opening entry payload, and item sale (customer, item, payment, warehouse). To test another store or item, edit the JSON, not the specs.

---

## Page Object Model (POM)

Every screen or popup is one class in `pageObjects/`. Each page object:

1. **extends `BasePage`** and calls `super(page)`
2. declares **locators** in the constructor, grouped under `// ── Locators ──` comments
3. exposes **business actions** (`validLogin()`, `quickPayment()`, `releaseTerminal()`) that hide clicks, waits and checks
4. builds **dynamic locators** with methods when they depend on data (`transactionGridSelectedItem(itemCode)`)

### BasePage

```js
class BasePage {
    constructor(page) {
        this.page = page
        this.wait = new WaitUtils(page)   // dynamic-UI waits
        this.path = null                  // each page sets its own URL
    }
    async open() {                        // same for every page …
        await this.navigateTo(this.path)
        await this.verifyPageLoaded()     // … but this call runs the child's version
    }
    async verifyPageLoaded() { throw new Error(`${this.pageName} must override verifyPageLoaded()`) }
    async navigateTo(endpoint = '') { ... }
    async waitForNetworkIdle() { ... }
    async verifyTitle(title) { ... }
}
```

A new page object therefore needs three things: `extends BasePage`, a `this.path` (or `null` for screens without a URL), and a `verifyPageLoaded()` override. See [OOP Concepts Used](#oop-concepts-used) for the full picture.

### PageManager

One manager per browser tab; every getter defaults to that tab:

```js
const deskPM = new PageManager(deskPage)
await deskPM.getHomePage().open()
const posPage = await deskPM.getRetailPage().openPosInterface()   // returns the new POS tab

const posPM = new PageManager(posPage)
await posPM.getPosDashboardPage().quickPayment()
```

### Page object catalogue

| Page Object | Area | Key methods |
|-------------|------|-------------|
| `BasePage` | shared | `open()`, `verifyPageLoaded()` (override), `navigateTo()`, `waitForNetworkIdle()`, `verifyTitle()`, `this.wait` |
| `LoginPage` | Desk | `open()`, `verifyPageLoaded()`, `validLogin()` |
| `HomePage` | Desk | `open()`, `verifyPageLoaded()`, `clickSidebarRetailButton()`, `logoutFromApplication()` |
| `RetailPage` | Desk | `open()`, `verifyPageLoaded()`, `clickSidebarRetailButton()`, `openPosInterface()` |
| `PosTerminalListPage` | Desk | `open()`, `verifyPageLoaded()`, `releaseTerminal()`, `verifyTerminalReleased()` |
| `GiftCardListPage` | Desk | `open()`, `verifyPageLoaded()`, `addFilter()`, `fillFilterDetails()`, `applyFilters()`, `clickFilteredSerialNo()`, `getGiftCardBalanceValue()` |
| `PosInvoicePage` | Desk | `open(invoiceNo)`, `verifyPageLoaded()`, `verifyInvoice()` |
| `PosTerminalPopup` | POS | `verifyPageLoaded()`, `selectPosTerminal()` |
| `OpeningAmountPopup` | POS | `fillOpeningAmount()` (skips itself when a shift is already open) |
| `PosDashboardPage` | POS | `verifyPageLoaded()`, `verifyTransactionMode()`, `verifyItemAddedToTransaction()`, `quickPayment()` |
| `PosDashboardMenu` | POS | `clickGiftCardButton()`, `clickVoidTransactionButton()` |
| `GiftCardSearchPage` | POS | `verifyPageLoaded()`, `searchAndAddGiftCard()` |
| `PaymentDetailsPage` | POS | `captureTransactionNo()`, `clickNewTransaction()` |

---

## Custom Fixtures

`fixtures/testFixtures.js` extends Playwright's `test`:

| Fixture | Gives you | Session |
|---------|-----------|---------|
| `pm` | `PageManager` for the test's `page` | browser, from storageState |
| `apiUtils` | `APIUtils`, already logged in; logs out + disposes after the test | separate API session |
| `terminalName` | This worker's POS terminal (`utils/TerminalPool.js`) | – |
| `env` | `ENV` (base URL, credentials) | – |
| `posData` | `testData/posData.json` | – |

```js
const { test, expect } = require('../fixtures/testFixtures')

test('Item Sale E2E test using API', async ({ page, pm, apiUtils, terminalName }) => {
    const hardwareId = await apiUtils.bindTerminal(terminalName)
    await pm.getHomePage().open()
    // ...
})
```

Fixtures are test-scoped, so they can't be used in `beforeAll`. That's why the serial Web E2E builds its own context and `PageManager` objects, and gets its terminal with `getTerminalForWorker(testInfo)`.

---

## Wait Utilities (`WaitUtils`)

The POS and Desk build their screens dynamically: the page has loaded, but an element appears, fills in or changes a few seconds later. A one-time `isVisible()` check then sees nothing and the test takes the wrong branch, while a fixed `waitForTimeout()` is either too short or wastes time.

`utils/WaitUtils.js` is available in every page object as **`this.wait`** (created in `BasePage`):

| Method | Use it when | On timeout |
|--------|-------------|------------|
| `isVisibleWithin(locator, ms)` | An element *may* appear (popup, banner) and you need to decide | returns `false` |
| `waitForFirstVisible([a, b], ms)` | Either of several screens can show up | returns `-1` |
| `waitForVisible(locator)` / `waitForHidden(locator)` | An element *must* appear / disappear | fails |
| `waitForText(locator, textOrRegex)` | Text is filled in after the element appears | fails |
| `waitForValue(locator, valueOrRegex)` | An input is filled in later (default: not empty) | fails |
| `waitForCount(locator, min)` | A list or grid fills in gradually | fails |
| `waitForDomToSettle({ quietMs })` | The UI keeps re-rendering after an action | returns `false` |
| `waitForNetworkIdle(ms)` | Background calls must finish (never fails on open sockets) | continues |
| `retry(async () => { … })` | A whole step (action + check) must be repeated until it passes | fails |

```js
// Optional popup: wait up to 5s before deciding it is not there
if (await this.wait.isVisibleWithin(this.confirmPopup, 5 * 1000)) { ... }

// Receipt is drawn first, invoice number filled in afterwards
await this.wait.waitForText(this.transactionNoSection, /NO\.\s*:\s*\S+/)

// Dropdown commits its value asynchronously
await this.wait.waitForDomToSettle({ quietMs: 500 })
```

Every method in `utils/WaitUtils.js` has `@example` blocks taken from this app (hover the method in VS Code to see them).

Where the framework uses it today: release-terminal button, opening-amount popup, confirm-payment popup and its text, terminal popup (appearance and submit), receipt number, gift card balance. No fixed `waitForTimeout()` is left in the page objects.

Plain actions (`click`, `fill`) and `expect(...)` assertions already wait for their element. Use `WaitUtils` when you have to decide something, read a value that arrives late, or wait for the UI to stop changing.

---

## API Layer (`APIUtils`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `loginWithAPI()` | `POST api/method/login` | Start the API session |
| `logoutWithAPI()` | `POST api/method/logout` | End it (frees a server session) |
| `getTerminal()` | `GET frappe.desk.form.load.getdoc` | Current `hardware_id` of a terminal |
| `setTerminalToDB()` | `POST frappe.client.set_value` | Bind a released terminal to a new UUID |
| `bindTerminal()` | – | `getTerminal` + `setTerminalToDB`; returns the bound ID |
| `getOpeningEntry()` | `POST …point_of_sale.get_opening_entry` | Open shift, or `null` |
| `createOpeningEntry()` | `POST …point_of_sale.create_pos_opening_entry` | Open a new shift |
| `checkExistingOpeningEntry()` | – | Reuse or create a shift |
| `getCsrfTokenAfterLoggedIn()` | – | `frappe.csrf_token` from a logged-in page |
| `saleItem()` | `POST …pos_invoice.submit_pos_invoice` | Submit a POS invoice |

---

## OOP Concepts Used

Where each object-oriented concept lives in this framework, with the real code.

| Concept | Where | In one line |
|---------|-------|-------------|
| [Class & Object](#class--object) | `pageObjects/*`, `utils/APIUtils.js`, `utils/WaitUtils.js` | Each screen / helper is a class; tests work with its objects |
| [Encapsulation](#encapsulation) | every page object | Locators + the steps that use them live inside the class |
| [Abstraction](#abstraction) | `releaseTerminal()`, `bindTerminal()`, `quickPayment()` | One readable call hides many clicks, waits and branches |
| [Inheritance](#inheritance) | `BasePage` → 12 page objects | Shared behaviour written once, reused by every page |
| [Polymorphism](#polymorphism) | `open()` + `verifyPageLoaded()` overrides | Same call, page-specific behaviour |
| [Composition](#composition) | `PageManager`, fixtures, `BasePage.wait` | Objects built from other objects |
| [Dependency Injection](#dependency-injection) | `constructor(page)`, `new APIUtils(...)` | Dependencies are passed in, not created inside |
| [Factory pattern](#factory-pattern) | `PageManager.getXxxPage()` | Page objects are created in one place |

### Class & Object

A **class** is the blueprint of a screen; an **object** is that screen in one particular browser tab.

```js
// pageObjects/PosDashboardPage.js – the blueprint
class PosDashboardPage extends BasePage {
    constructor(page) {
        super(page)
        this.quickCashButton = page.locator("smart-button[class*='quick_cash'] button")
    }
    async quickPayment() { ... }
}

// a spec – one object for the POS tab
const dashboard = new PosDashboardPage(posPage)
await dashboard.quickPayment()
```

### Encapsulation

The locators and the steps that use them are kept **inside** the class. Specs never see a selector, so when the UI changes, only one file is updated.

```js
// pageObjects/PaymentDetailsPage.js
this.transactionNoSection = page.locator("[id='page-pos-interface'] table tbody tr:nth-child(5) td")

async captureTransactionNo() {
    await this.wait.waitForText(this.transactionNoSection, /NO\.\s*:\s*\S+/)
    const text = await this.transactionNoSection.textContent()
    return text.split(':')[1].split('\n')[0].trim()      // parsing hidden from the spec
}

// spec – only the business result is visible
transactionNo = await posPM.getPaymentDetailsPage().captureTransactionNo()
```

`GiftCardListPage` also keeps internal **state**: `fillFilterDetails()` stores the pending list-reload promise in `this.reportViewResponse`, and `applyFilters()` awaits it. The spec never knows the promise exists.

### Abstraction

A method names *what* happens and hides *how*.

```js
// spec: one line
await deskPM.getPosTerminalListPage().releaseTerminal(terminalName)

// pageObjects/PosTerminalListPage.js: what that line does
async releaseTerminal(terminalName) {
    await this.open()                                 // list page + load check
    await this.clearAllFilters()
    await this.posTerminalByName(terminalName).click()
    await expect(this.saveButton).toBeVisible()
    await this.clickReleaseTerminal()                 // only if the button is there
    await this.verifyTerminalReleased()
}
```

Other examples: `APIUtils.bindTerminal()` (read terminal → maybe assign a UUID → return it), `OpeningAmountPopup.fillOpeningAmount()` (skips itself when a shift is open), `PosDashboardPage.quickPayment()` (pay + confirm popup).

### Inheritance

`BasePage` holds what every screen needs; each page `extends` it and calls `super(page)`.

```js
// pageObjects/BasePage.js
class BasePage {
    constructor(page) {
        this.page = page
        this.wait = new WaitUtils(page)
        this.path = null
    }
    async navigateTo(endpoint = '') { ... }
    async waitForNetworkIdle() { ... }
    async open() { ... }
}

// pageObjects/HomePage.js
class HomePage extends BasePage {
    constructor(page) {
        super(page)                 // page, wait, path come from BasePage
        this.path = 'app/home'
        this.homeHeading = page.getByRole('heading', { name: 'Home' })
    }
}
```

Every page object therefore has `this.page`, `this.wait`, `open()`, `navigateTo()` and `pageName` without writing them again.

### Polymorphism

**One call, different behaviour depending on the object.** `BasePage.open()` is a *template method*: the steps are fixed, but one of them, `verifyPageLoaded()`, is **overridden** by each page.

```js
// pageObjects/BasePage.js – the template (same for every page)
async open() {
    await this.navigateTo(this.path)
    await this.verifyPageLoaded()       // resolved at run time to the child's method
    console.log(`${this.pageName} opened`)
}
async verifyPageLoaded() {              // "abstract": a page that can be opened must override it
    throw new Error(`${this.pageName} must override verifyPageLoaded()`)
}
```

```js
// Each page overrides the hook with its own meaning of "loaded"
class HomePage extends BasePage {
    async verifyPageLoaded() {
        await expect(this.page).toHaveTitle('Home')
        await expect(this.homeHeading).toBeVisible()
    }
}

class GiftCardListPage extends BasePage {
    async verifyPageLoaded() {
        await expect(this.page).toHaveTitle('Gift Card')
        await expect(this.giftCardPageHeading).toHaveText('Gift Card')
    }
}

class PosTerminalListPage extends BasePage {
    async verifyPageLoaded() {
        await expect(this.addPosTerminalButton).toBeVisible()
    }
}
```

```js
// The caller does not care which page it is
await pm.getLoginPage().open()          // LoginPage.verifyPageLoaded()     → "Welcome Back" form
await pm.getHomePage().open()           // HomePage.verifyPageLoaded()      → title + heading
await pm.getGiftCardListPage().open()   // GiftCardListPage.verifyPageLoaded()

// …so a list of different pages can be handled the same way
for (const desk of [pm.getHomePage(), pm.getRetailPage(), pm.getGiftCardListPage()]) {
    await desk.open()
}
```

**Overriding and extending with `super`:** `PosInvoicePage` needs an invoice number in its URL, so it overrides `open()` itself, sets the path, and then reuses the parent's template:

```js
// pageObjects/PosInvoicePage.js
async open(invoiceNo) {
    this.path = `app/pos-invoice/${invoiceNo}`
    await super.open()                  // BasePage.open() → navigate + this.verifyPageLoaded()
}
```

**Screens without a URL** (POS dashboard and popups) keep `path = null` but still override `verifyPageLoaded()`, so specs check them with the same method name:

```js
await posPM.getPosTerminalPopup().verifyPageLoaded()    // waits, reloads once if needed
await posPM.getPosDashboardPage().verifyPageLoaded()    // POS title + transaction mode
await posPM.getGiftCardSearchPage().verifyPageLoaded()  // "Gift Card Sale" popup
```

| Page | `path` | Its `verifyPageLoaded()` checks |
|------|--------|---------------------------------|
| `LoginPage` | `''` | title Login, "Welcome Back", editable fields |
| `HomePage` | `app/home` | title Home, Home heading |
| `RetailPage` | `app/retail` | Retail heading, POS link |
| `PosTerminalListPage` | `app/pos-terminal` | "Add POS Terminal" button |
| `GiftCardListPage` | `app/gift-card` | title + heading Gift Card |
| `PosInvoicePage` | `app/pos-invoice/<no>` (set in `open`) | form heading after network idle |
| `PosDashboardPage` | – | POS title, transaction mode |
| `PosTerminalPopup` | – | popup visible (one reload as fallback) |
| `GiftCardSearchPage` | – | "Gift Card Sale" heading |

### Composition

Objects are built **from** other objects ("has-a"), rather than by inheriting from them.

```js
// BasePage has a WaitUtils
this.wait = new WaitUtils(page)

// PageManager has every page object
getGiftCardListPage(customPage = this.page) { return new GiftCardListPage(customPage) }

// The apiUtils fixture has an APIRequestContext and a terminal
apiUtils: async ({ playwright, terminalName }, use) => {
    const apiUtils = new APIUtils(ENV.baseUrl, await playwright.request.newContext(), ...)
    ...
}
```

### Dependency Injection

Classes receive what they need instead of creating it, so the same class works for any tab, context or environment.

```js
new PageManager(deskPage)               // Desk tab
new PageManager(posPage)                // POS tab – same class, different page

new APIUtils(ENV.baseUrl, apiContext, loginPayload, getOpeningEntryPayload, createOpeningEntryPayload)
```

### Factory pattern

`PageManager` is the single place page objects are created; a default parameter lets one getter serve any tab.

```js
class PageManager {
    constructor(page) { this.page = page }
    getHomePage(customPage = this.page) { return new HomePage(customPage) }
    getPosDashboardPage(customPage = this.page) { return new PosDashboardPage(customPage) }
}

const posPM = new PageManager(posPage)
await posPM.getPosDashboardPage().quickPayment()
```

---

## Shared Test Resources

Two things in the app are shared between tests and need care.

### The POS terminal

A terminal bound to one browser (`hardware_id`) disappears from the "Select POS Terminal" dropdown in every other browser. So each worker gets its **own terminal** (`utils/TerminalPool.js`):

```json
"terminals": ["CI-CD Terminal", "CI-CD-Terminal2"]
```

| Worker (`parallelIndex`) | Terminal |
|--------------------------|----------|
| 0 | `CI-CD Terminal` |
| 1 | `CI-CD-Terminal2` |

- **Web E2E** gets it with `getTerminalForWorker(testInfo)` in `beforeAll`, and releases it in `beforeAll` and `afterAll`.
- **Web + API E2E** gets it from the `terminalName` fixture, binds it through the API and releases it in `afterEach`.

Run in parallel with `WORKERS=2` (or set it in `.env`). To add more workers:

1. Create another terminal in the app (Desk › POS Terminal, same company / store as `CI-CD Terminal`).
2. Add it to `testData/posData.json → terminals`.
3. Raise `WORKERS`. A worker without a terminal in the list fails straight away with a clear message.

Each terminal gets its own shift, so terminals don't share an opening entry either.

### User sessions

The test user may only have **2 sessions at once** (User › `simultaneous_sessions = 2`). On a new login beyond that, Frappe ends the *oldest* session, which is the saved storageState.

- One session: the browser (storageState from `auth.setup.js`)
- One session: the API (`apiUtils`), which **logs out after every test**

Avoid logging in as the test user in your own browser during a run, and never call `logoutFromApplication()` with the saved session.

**With 2 workers** this still fits: only the Web + API spec opens an API session, so at most browser + 1 API = 2 sessions are open. If you add more specs that use `apiUtils` and run them in parallel, raise **Simultaneous Sessions** for the test user (User form in Desk) to `workers + 1`.

---

## Reporting

```js
reporter: [
  isCI ? ['github'] : ['list'],
  ['reporting-labs', reportingLabs]
],
```

reporting-labs (`reporting-labs.config.ts`):

- **Output**: `reporting-labs/index.html` + `report.json`
- **Title / project**: `Retail POS – regression`
- **Metadata**: `env` from `TEST_ENV`, `branch` from `GITHUB_REF_NAME`, CI run number in the trend
- **Masking**: `APP_PASSWORD` is hidden everywhere (passwords, tokens and cookies are masked by default)
- **API capture**: every `request.*` call is recorded in the report
- **Steps**: `test.step()` blocks show as step bars
- **meta()**: priority / severity / feature / owner on every test feed the Breakdown charts
- **History**: `reporting-labs.history.json` powers trend, flaky and "new vs known" failures

| Artifact | Setting | Where |
|----------|---------|-------|
| Screenshots | `only-on-failure` (chrome) | `test-results/` + embedded in the report |
| Traces | `retain-on-failure` | `test-results/**/trace.zip` |

---

## CI/CD – GitHub Actions

Pipeline: `.github/workflows/playwright.yml`

### Triggers

- `push` / `pull_request` on `main` / `master` – runs on **Chrome**
- `workflow_dispatch` – manual run with `project` (`chrome` / `safari` / `all`) and optional `tag`

### One-time setup (Settings → Secrets and variables → Actions)

| Kind | Name | Value |
|------|------|-------|
| Secret | `BASE_URL` | Test environment the runner can reach |
| Secret | `APP_USERNAME` / `APP_EMAIL` / `APP_PASSWORD` | Test user |
| Variable | `POS_API_MODULE` | Server module of the POS API |
| Variable (optional) | `TEST_ENV` | Report label (default `ci`) |
| Variable (optional) | `PUBLISH_REPORT_TO_PAGES` | `true` to publish the report to GitHub Pages |

### Job `test`

| Step | Action |
|------|--------|
| 1–4 | Checkout, Node LTS (npm cache), `npm ci`, install browsers |
| 5 | Restore `reporting-labs.history.json` from cache |
| 6 | `npx playwright test --project=<chrome>` (+ `--grep` if given) |
| 7 | Save history to cache |
| 8 | Job summary from `report.json` (pass/fail table + failed tests) |
| 9 | Upload `reporting-labs/` as **reporting-labs-report** (30 days) |
| 10 | On failure, upload `test-results/` (traces, screenshots) |
| 11 | Optional: package the report for GitHub Pages |

Job **`publish-report`** (optional) deploys the report to GitHub Pages when `PUBLISH_REPORT_TO_PAGES=true` and the event isn't a pull request.

---

## Best Practices Followed

- **Log in once, reuse the session** – login page tested in setup, storageState everywhere else
- **API for setup, UI for checks** – faster, more stable tests
- **No secrets in code** – `.env` / GitHub Secrets; session file and `.env` git-ignored
- **Web-first assertions** with auto-waiting; user-facing locators where the DOM allows
- **Independent of run order** – each spec frees the shared terminal it uses
- **Self-healing cleanup** – a failed sale is voided before the next test
- **Readable reports** – `test.step()`, `meta()`, short console logs
- **No fixed sleeps** – `WaitUtils` waits for the real condition instead
- **CI guard rails** – `forbidOnly`, retries, headless

---

## Known Issues & Limitations

| Area | Details |
|------|---------|
| **WebKit (Safari)** | The POS app usually crashes while starting on WebKit (`TypeError: null is not an object (evaluating 'r.innerHTML')`) and renders nothing. This is an app bug, not a test problem: plain page loads without any test code show it in about 4 of 5 attempts. Both POS specs are marked `test.fixme` on WebKit; remove that line in each spec once the app is fixed. Chrome is the default browser. |
| CI environment | A GitHub-hosted runner can't reach `localhost:8080`. Point `BASE_URL` at a reachable server, or use a self-hosted runner next to the app |
| Test data | Every run creates real POS invoices and gift cards in the target environment |
| Parallel runs | Limited by the terminals in `posData.json` (currently 2) and, once several parallel specs use the API, by the test user's session limit (see [Shared Test Resources](#shared-test-resources)) |

---

## Working with Claude Code

- **`CLAUDE.md`** is read automatically by Claude Code in this folder: commands, folder roles, coding rules and the gotchas above (session limit, terminals, WebKit).
- **Project skills** in `.claude/skills/` load when a request matches them:

| Skill | Triggers on | What it does |
|-------|-------------|--------------|
| `create-page-object` | "add locators for…", "make a page object for…", "this element is not found" | Inspects the screen, picks locators in this project's priority order, writes the class (`extends BasePage`, `path`, `verifyPageLoaded()`, `this.wait`), registers it in `PageManager` |
| `create-test-script` | "automate this scenario", "add a test for…", "add an API call for…" | Chooses Web E2E vs Web + API, writes the spec from the project templates (fixtures, tags, `meta()`, `test.step()`, terminal per worker, release), adds `APIUtils` methods and test data, runs it |

---

## Author

**Sudhanshu Shekhar**
