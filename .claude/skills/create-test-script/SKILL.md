---
name: create-test-script
description: Write new Playwright test scripts and test logic for this retail POS framework the way the existing specs do it - Web E2E with PageManager, Web + API with fixtures, storageState login, per-worker POS terminals, tags, meta(), test.step(), test data in posData.json, APIUtils methods. Use this whenever the user asks to automate a scenario, add a test case or spec, cover a new POS/Desk flow (sale, return, void, gift card, customer, shift), add an API call to APIUtils, or turn manual steps into a test - even if they just describe the steps.
---

# Create test scripts and test logic

Specs live in `tests/` and contain **only test logic**: which steps happen and what is asserted. All selectors live in page objects (see the `create-page-object` skill), all API calls in `utils/APIUtils.js`, all business data in `testData/posData.json`. Read the two existing specs before writing a new one — they are the templates:

- `tests/WebE2ETestPageManager.spec.js` – UI-only, serial, PageManager per tab
- `tests/E2EUsingWebAndAPI.spec.js` – API setup + API action + UI verification, fixtures

## 1. Pick the shape of the test

| The scenario… | Shape | Template |
|---------------|-------|----------|
| must be done through the UI, several dependent test cases (TC-02 needs TC-01's result) | `test.describe.serial` + `beforeAll`, own context | Web E2E spec |
| is one flow where setup can go through the API | single `test()` with fixtures `page`, `pm`, `apiUtils`, `terminalName`, `posData` | Web + API spec |
| only checks Desk data (no POS) | single `test()` with `pm` | either; no terminal needed |

Prefer API for setup (bind terminal, open shift, create data) and the UI for what the user actually sees — it is faster and less flaky. Only drive the UI for setup when the UI path is what is being tested.

## 2. Rules every test follows

- **Logged in already.** Browser projects use `storageState` from `tests/auth.setup.js`. Never log in through the UI in a spec; never call `logoutFromApplication()` (it would end the shared session).
- **Own terminal per worker.** Get it from the `terminalName` fixture, or `getTerminalForWorker(testInfo)` in `beforeAll`. Never hard-code a terminal name.
- **Release what you bind.** Release the terminal in `afterEach` / `afterAll` (`pm.getPosTerminalListPage().releaseTerminal(terminalName)`), and in a serial UI suite also before opening the POS.
- **API session hygiene.** Use the `apiUtils` fixture (it logs in and logs out). If you must build an `APIUtils` yourself, call `logoutWithAPI()` at the end: the test user may only have 2 sessions and a third drops the browser session.
- **Tags**: `{ tag: '@web' }`, `{ tag: '@API' }` or both, so `npm run webTests` / `APITests` pick them up.
- **Report metadata**: first line of each test `meta({ priority: 'P0'|'P1'|…, severity, feature, owner })` from `reporting-labs`.
- **Steps**: group the flow with `await test.step('Readable step', async () => { … })` – they become step bars in the report.
- **Timeouts**: default is 30s per test, shared with hooks. Long single tests call `test.slow()`; long `beforeAll` hooks call `test.setTimeout(90 * 1000)`.
- **WebKit**: POS specs start with `test.fixme(({ browserName }) => browserName === 'webkit', 'POS app crashes on WebKit at start-up (app bug)')`.
- **Data**: new values go into `testData/posData.json` and are read via the `posData` fixture; environment values via `ENV` / `env`.
- **Assertions**: web-first `expect(locator)` in page objects for UI state; plain `expect(value)` in the spec for returned business data (invoice numbers, API response fields).

## 3. Template – Web + API test (fixtures)

```js
/**
 * Web + API E2E – <scenario>
 * ==========================
 * <What the API prepares, what the UI verifies, in 2-3 lines.>
 *
 * Flow
 *   API  <setup>
 *   UI   <open screen> → <check>
 *   API  <action> → check the response
 *   UI   <verify result in Desk>
 */
const { test, expect } = require('../fixtures/testFixtures');
const { meta } = require('reporting-labs');
const { PageManager } = require('../pageObjects/PageManager');

test.fixme(({ browserName }) => browserName === 'webkit', 'POS app crashes on WebKit at start-up (app bug)');

test('<Scenario name>', { tag: ['@API', '@web'] }, async ({ page, pm, apiUtils, posData, terminalName }) => {
    meta({ priority: 'P1', severity: 'major', feature: '<Feature>', owner: 'Sudhanshu Shekhar' });
    test.slow();
    let posPage

    await test.step('API: bind terminal and open shift', async () => {
        const hardwareId = await apiUtils.bindTerminal(terminalName)
        await apiUtils.checkExistingOpeningEntry()
        await page.context().addInitScript((id) => window.localStorage.setItem('hardware_id', id), hardwareId)
    })

    await test.step('UI: open POS in Sale mode', async () => {
        await pm.getHomePage().open()
        await pm.getHomePage().clickSidebarRetailButton()
        posPage = await pm.getRetailPage().openPosInterface()
        await new PageManager(posPage).getPosDashboardPage().verifyPageLoaded()
    })

    await test.step('<action and checks>', async () => {
        // ...
    })
});

test.afterEach(async ({ pm, terminalName }) => {
    await pm.getPosTerminalListPage().releaseTerminal(terminalName)
})
```

## 4. Template – Web E2E serial suite (UI only)

```js
const { test, expect } = require('../fixtures/testFixtures')
const { meta } = require('reporting-labs')
const { PageManager } = require('../pageObjects/PageManager')
const { ENV } = require('../config/env')
const { getTerminalForWorker } = require('../utils/TerminalPool')
const posData = require('../testData/posData.json')

let context, deskPage, posPage, deskPM, posPM, terminalName
let resultFromTc01          // values passed between serial tests

test.describe.serial('<Suite>', { tag: '@web' }, () => {
    test.fixme(({ browserName }) => browserName === 'webkit', 'POS app crashes on WebKit at start-up (app bug)');

    test.beforeAll(async ({ browser }, testInfo) => {
        test.setTimeout(90 * 1000)
        terminalName = getTerminalForWorker(testInfo)

        context = await browser.newContext({ storageState: ENV.authFile })   // own context keeps both tabs open
        deskPage = await context.newPage()
        deskPM = new PageManager(deskPage)

        await deskPM.getPosTerminalListPage().releaseTerminal(terminalName)
        await deskPM.getHomePage().open()
        await deskPM.getHomePage().clickSidebarRetailButton()
        posPage = await deskPM.getRetailPage().openPosInterface()
        posPM = new PageManager(posPage)

        await posPM.getPosTerminalPopup().verifyPageLoaded()
        await posPM.getPosTerminalPopup().selectPosTerminal(terminalName)
        await posPM.getOpeningAmountPopup().fillOpeningAmount(terminalName, posData.openingAmount.denomination, posData.openingAmount.count)
        await posPM.getPosDashboardPage().verifyPageLoaded()
    })

    test('TC-01 <name>', async () => {
        meta({ priority: 'P0', severity: 'critical', feature: '<Feature>', owner: 'Sudhanshu Shekhar' })
        await test.step('<step>', async () => { /* posPM... */ })
    })

    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== 'failed') return
        try {                                         // leave the POS clean for the next test
            await posPage.reload()
            await posPM.getPosDashboardMenu().clickVoidTransactionButton()
            await posPM.getPosDashboardPage().clickConfirmPopupYesButton()
        } catch (e) { console.error('Recovery failed', e) }
    })

    test.afterAll(async () => {
        if (!deskPage) return
        await deskPM.getPosTerminalListPage().releaseTerminal(terminalName)
        await context.close()                         // no logout: shared session
    })
})
```

## 5. Adding test logic outside the spec

- **New screen / button / field** → page object method (create-page-object skill), then call it from the spec.
- **New API call** → method in `utils/APIUtils.js`, same style as the existing ones:
  ```js
  /** One line: what it does and what it returns. */
  async getCustomer(customerCode){
      const response = await this.apiContext.get(this.baseUrl + "api/method/frappe.desk.form.load.getdoc", {
          params: { doctype: 'Customer', name: customerCode }
      })
      await expect(response).toBeOK()
      const customer = (await response.json()).docs[0]
      console.log(`Customer ${customerCode}: ${customer.customer_name}`)
      return customer
  }
  ```
  Frappe endpoints are `api/method/<python.path>`; POSTs from the API session need no CSRF header (the browser session would). Log one short line, not whole responses.
- **Request bodies** → a small builder function at the top of the spec (see `buildSalePayload`) fed from `posData`.
- **New fixture** → `fixtures/testFixtures.js` when several tests need the same ready-made object; keep it test-scoped and clean up after `use()`.
- **New test data** → `testData/posData.json`, grouped by feature.

## 6. Run and verify

```bash
npx playwright test --list                                   # file loads, tags right
npx playwright test tests/<New>.spec.js --project=chrome     # the new spec (setup runs first)
npm run regression                                           # nothing else broke
WORKERS=2 npm run regression                                 # still safe in parallel
```

A test is done when it passes twice in a row and the full regression is green. On failure, read `test-results/**/error-context.md` and the screenshot before changing code; then add a script entry to `package.json` if the user will run the spec on its own, and describe the spec in `README.md` → Test Suites.
