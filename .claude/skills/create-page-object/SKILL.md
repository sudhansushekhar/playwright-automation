---
name: create-page-object
description: Create or extend page objects and locators for this retail POS Playwright framework, following its exact pattern (BasePage inheritance, this.path + verifyPageLoaded() override, grouped locators, dynamic locator methods, WaitUtils, PageManager registration). Use this whenever the user wants to add a locator, add or change a page object, automate a new Desk or POS screen or popup, fix a broken selector, or says things like "create locators for the Customer page", "add the Cash payment button", "this element is not found", "make a page object for X" — even if they don't say "page object".
---

# Create page objects and locators

Page objects live in `pageObjects/`, one class per screen or popup. They hide every selector from the specs, so a UI change means editing one file. Keep new code indistinguishable from the existing classes; read one or two of them first (`GiftCardListPage.js` for a Desk list page, `PosDashboardPage.js` for a POS screen).

## 1. Find out what the screen looks like

Look at the real DOM before writing selectors — guessing produces brittle locators.

- If the Playwright MCP browser tools are available: navigate to the screen and take a snapshot (`browser_snapshot`) to see roles, names and attributes.
- Otherwise run a short probe script with the saved session (`playwright/.auth/user.json`, created by `npm run regression` or the `setup` project), list candidate selectors with `locator.count()` and `innerText()`.
- `npx playwright codegen <BASE_URL>` also works for a quick look.

Desk pages are at `BASE_URL/app/<route>`. The POS opens in a new tab from the POS launcher link on the Retail page and has no stable deep links, so POS screens are reached by flow, not by URL.

## 2. Choose the locator (in this order)

| Priority | Use | Example from this project |
|----------|-----|---------------------------|
| 1 | Role + accessible name | `page.getByRole('button', { name: 'Add POS Terminal' })` |
| 2 | Visible text (exact when the text is short or repeated) | `page.getByText('Start Selling')`, `page.getByText(name, { exact: true })` |
| 3 | Frappe field by fieldname | `page.locator("[data-fieldname='grand_total'] .control-value")` |
| 4 | Frappe page container, then child | `page.locator("[id='page-List/Gift Card/List']")` → `.locator("h3")` |
| 5 | POS components by attribute / class fragment | `page.locator("smart-button[class*='quick_cash'] button")`, `"ivend-dynamic-button[data_parameter_1*='gift_card_sale'] button"` |
| 6 | Stable id | `page.locator('#pos_terminal_windowHeader')` |

Why this order: roles and text are what a user sees and rarely change; Frappe's `data-fieldname` and page ids are generated from the DocType and stay stable; POS `smart-*`/`ivend-*` components need attribute or `class*=` matches because their inner markup is generated. Avoid auto-generated ids (`#gridcell_bbbf`), deep `nth-child` chains and XPath — they break on the next release. Use `nth-child` only where the app has no better hook (the receipt row in `PaymentDetailsPage`), and comment why.

Scope child locators from a parent locator instead of repeating long selectors:

```js
this.giftCardPage = page.locator("[id='page-List/Gift Card/List']")
this.giftCardPageHeading = this.giftCardPage.locator("h3")
```

## 3. Write the class

```js
/**
 * CustomerListPage
 * ----------------
 * Desk › Customer list: <one line on what tests do here>.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class CustomerListPage extends BasePage{
    constructor(page){
        super(page)
        this.path = 'app/customer'          // null for POS screens / popups without a URL

        // ── Locators: list view ───────────────────────────────────
        this.customerPage = page.locator("[id='page-List/Customer/List']")
        this.customerPageHeading = this.customerPage.locator("h3")
        this.addCustomerButton = page.getByRole('button', { name: 'Add Customer' })

        // ── Locators: customer form ───────────────────────────────
        this.customerNameValue = page.locator("[data-fieldname='customer_name'] .control-value")
    }

    // ── Dynamic locators ──────────────────────────────────────────

    customerByName(customerName) {
        return this.page.getByRole('link', { name: customerName })
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): the Customer list is ready. */
    async verifyPageLoaded(){
        await expect(this.page).toHaveTitle('Customer')
        await expect(this.addCustomerButton).toBeVisible()
    }

    /** Open a customer from the list and wait for its form. */
    async openCustomer(customerName){
        await this.customerByName(customerName).click()
        await this.wait.waitForText(this.customerNameValue, customerName)
    }
}

module.exports = {CustomerListPage};
```

What each part is for:
- **`extends BasePage` + `super(page)`** gives `this.page`, `this.wait`, `open()`, `navigateTo()`, `pageName`.
- **`this.path`** makes `await page.open()` work (navigate + `verifyPageLoaded()`). Leave `null` for screens reached by flow. If the URL needs data (like an invoice number), override `open(arg)`, set `this.path`, then call `super.open()` — see `PosInvoicePage`.
- **`verifyPageLoaded()`** is the polymorphic hook: assert what "this screen is ready" means (title, heading, a key button). Every page that can be opened or checked overrides it.
- **Locators** are properties set in the constructor, grouped with `// ── Locators: <area> ──` dividers. Name them `<thing><Type>`: `saveButton`, `filterFieldInput`, `statusPill`, `giftCardSerialNos` (plural for lists).
- **Dynamic locators** are methods when the selector depends on data.
- **Actions** are named after the business step (`releaseTerminal`, `quickPayment`), assert their own outcome with web-first `expect`, and return values the test needs (`captureTransactionNo()` returns the invoice number).
- **Comments**: file header `/** … */`, section dividers, one-line JSDoc on public methods. Explain *why* for anything non-obvious (an async dropdown, a conditional popup).

## 4. Dynamic content: use `this.wait`, never sleeps

The app renders a lot after load. Pick the WaitUtils method that matches the situation (examples are in `utils/WaitUtils.js`):

| Situation | Use |
|-----------|-----|
| Element may or may not appear (popup, optional button) | `if (await this.wait.isVisibleWithin(loc, 5000)) { … }` — never a bare `isVisible()` (it checks once) |
| One of several screens appears | `await this.wait.waitForFirstVisible([a, b])` |
| Text / value is filled in after the element appears | `waitForText(loc, /regex/)`, `waitForValue(loc)` |
| List fills in gradually | `waitForCount(loc, 1)` |
| UI keeps re-rendering after an action (dropdown commit) | `waitForDomToSettle({ quietMs: 500 })` |
| A step must be repeated until it sticks | `retry(async () => { action; expect })` |

Clicks, fills and `expect(...)` already auto-wait — don't wrap those.

## 5. Register and document

1. Add a getter to `pageObjects/PageManager.js` in the right group (Desk or POS):
   ```js
   getCustomerListPage(customPage = this.page) { return new CustomerListPage(customPage); }
   ```
2. Add a row to the page object catalogue in `README.md` (and to the Polymorphism table if it overrides `verifyPageLoaded()`).
3. Selectors that need data from tests take it as parameters; the data itself belongs in `testData/posData.json`.

## 6. Verify

- `node --check pageObjects/<File>.js` and `npx playwright test --list` (loads every spec).
- Exercise the new code: run the spec that uses it, or a one-off test that calls `open()` / the new action, with `npx playwright test <spec> --project=chrome`.
- If a locator fails, open `test-results/**/error-context.md` (page snapshot at failure) or the trace before changing the selector.
