/**
 * WaitUtils
 * ---------
 * Waits for pages that build their UI dynamically: the page has "loaded", but an element
 * appears, fills in or changes a few seconds later. Use these instead of fixed
 * `page.waitForTimeout()` sleeps.
 *
 * Available in every page object as `this.wait` (created in BasePage). In a spec, use it
 * through a page object, or create one for any page:
 *
 *   const { WaitUtils } = require('../utils/WaitUtils')
 *   const wait = new WaitUtils(page)
 *
 * Which method?
 *   - May the element appear or not, and you must decide?  → isVisibleWithin / waitForFirstVisible
 *   - Must it appear, disappear or get its text/value?     → waitForVisible / waitForHidden / waitForText / waitForValue
 *   - Is a list filling in row by row?                     → waitForCount
 *   - Is the whole screen still re-rendering?              → waitForDomToSettle
 *   - Does a whole step sometimes need a second try?       → retry
 *
 * Plain Playwright actions (click, fill) and `expect(...)` assertions already wait for their
 * element - no WaitUtils needed for those.
 */
const { expect } = require('@playwright/test')

const DEFAULT_TIMEOUT = 15 * 1000

class WaitUtils {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        this.page = page
    }

    // ── Optional elements: return true / false, never fail ────────

    /**
     * Wait up to `timeout` ms for an element that may or may not appear (a popup, a banner).
     * Unlike `locator.isVisible()`, which checks only once, this gives slow UIs time to render.
     *
     * @example
     * // Confirmation popup opens a moment after "Quick Cash" - or not at all
     * await this.quickCashButton.click()
     * if (await this.wait.isVisibleWithin(this.confirmPopup, 5000)) {
     *     await this.confirmPopupYesButton.click()
     * }
     *
     * @example
     * // "Release Terminal" button only exists while the terminal is bound
     * if (await this.wait.isVisibleWithin(this.releaseTerminalButton, 3000)) {
     *     await this.releaseTerminalButton.click()
     * }
     */
    async isVisibleWithin(locator, timeout = 5 * 1000) {
        return locator.first().waitFor({ state: 'visible', timeout }).then(() => true, () => false)
    }

    /**
     * Wait until one of several elements is visible and return its index (or -1 on timeout).
     *
     * @example
     * // After opening the POS: is it asking for a terminal (0) or a new shift (1),
     * // or did it go straight to the sale screen (2)?
     * const screen = await this.wait.waitForFirstVisible([
     *     this.posTerminalWindow,
     *     this.openingAmountWindow,
     *     this.transactionMode,
     * ])
     * if (screen === 0) await this.selectPosTerminal(terminalName)
     * if (screen === -1) throw new Error('POS did not show any known screen')
     */
    async waitForFirstVisible(locators, timeout = DEFAULT_TIMEOUT) {
        const waits = locators.map((locator, index) =>
            locator.first().waitFor({ state: 'visible', timeout }).then(() => index))
        return Promise.any(waits).catch(() => -1)
    }

    // ── Required elements: fail with a clear message ──────────────

    /**
     * Fail unless the element becomes visible within `timeout` ms.
     *
     * @example
     * // Gift card search grid is rendered by JavaScript after the popup opens
     * await this.wait.waitForVisible(this.giftCardSearchPageItemLine, 20000)
     */
    async waitForVisible(locator, timeout = DEFAULT_TIMEOUT) {
        await expect(locator, `waiting for element to appear`).toBeVisible({ timeout })
    }

    /**
     * Fail unless the element disappears within `timeout` ms.
     *
     * @example
     * // Submit stays on screen (faded) while the terminal is being applied
     * await this.terminalSubmitButton.click()
     * await this.wait.waitForHidden(this.terminalSubmitButton, 20000)
     */
    async waitForHidden(locator, timeout = DEFAULT_TIMEOUT) {
        await expect(locator, `waiting for element to disappear`).toBeHidden({ timeout })
    }

    /**
     * Wait until the element's text contains a string or matches a RegExp.
     *
     * @example
     * // Receipt is drawn first; the invoice number is filled in afterwards
     * await this.wait.waitForText(this.transactionNoSection, /NO\.\s*:\s*\S+/)
     * const text = await this.transactionNoSection.textContent()
     *
     * @example
     * // Any text at all (the element exists but starts empty)
     * await this.wait.waitForText(this.confirmPopupText, /\S/)
     */
    async waitForText(locator, expected, timeout = DEFAULT_TIMEOUT) {
        await expect(locator, `waiting for text ${expected}`).toContainText(expected, { timeout })
    }

    /**
     * Wait until an input's value matches; with no `expected`, until it is not empty.
     *
     * @example
     * // Gift card form loads, then fills the Balance field
     * await this.wait.waitForValue(this.currencyValue)
     * const balance = await this.currencyValue.inputValue()
     *
     * @example
     * // Opening amount recalculated after entering the count
     * await this.wait.waitForValue(this.totalOpeningAmountValue, '20')
     */
    async waitForValue(locator, expected = /\S/, timeout = DEFAULT_TIMEOUT) {
        await expect(locator, `waiting for value ${expected}`).toHaveValue(expected, { timeout })
    }

    /**
     * Wait until at least `minCount` elements match (lists and grids that fill in gradually).
     *
     * @example
     * // Filtered Gift Card list: wait for the first result row before reading it
     * await this.applyFiltersButton.click()
     * await this.wait.waitForCount(this.giftCardSerialNos, 1)
     * const serialNo = await this.giftCardSerialNos.first().textContent()
     */
    async waitForCount(locator, minCount = 1, timeout = DEFAULT_TIMEOUT) {
        await expect.poll(() => locator.count(), { message: `waiting for at least ${minCount} element(s)`, timeout })
            .toBeGreaterThanOrEqual(minCount)
    }

    // ── Whole-page stability ──────────────────────────────────────

    /**
     * Wait until the page stops changing: no DOM mutation for `quietMs` ms.
     * Returns false (does not fail) if the page keeps changing for `timeout` ms, e.g. a live clock.
     *
     * @example
     * // Dropdown commits its value asynchronously - submitting right away is ignored
     * await this.terminalInDropdown(terminalName).click()
     * await this.wait.waitForDomToSettle({ quietMs: 500 })
     * await this.terminalSubmitButton.click()
     *
     * @example
     * // Log when the screen never calms down (animation, polling widget)
     * if (!(await this.wait.waitForDomToSettle({ quietMs: 300, timeout: 3000 }))) {
     *     console.log('Page still changing - continuing anyway')
     * }
     */
    async waitForDomToSettle({ quietMs = 500, timeout = 5 * 1000 } = {}) {
        return this.page.evaluate(({ quietMs, timeout }) => new Promise((resolve) => {
            let quietTimer
            const finish = (settled) => { observer.disconnect(); clearTimeout(quietTimer); clearTimeout(maxTimer); resolve(settled) }
            const observer = new MutationObserver(() => {
                clearTimeout(quietTimer)
                quietTimer = setTimeout(() => finish(true), quietMs)
            })
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
            quietTimer = setTimeout(() => finish(true), quietMs)
            const maxTimer = setTimeout(() => finish(false), timeout)
        }), { quietMs, timeout })
    }

    /**
     * Network idle, but never fails: some pages keep a socket or poll open.
     *
     * @example
     * await this.newTransaction.click()
     * await this.wait.waitForNetworkIdle()
     */
    async waitForNetworkIdle(timeout = 10 * 1000) {
        await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {})
    }

    // ── Retry a whole step ────────────────────────────────────────

    /**
     * Run `action` again and again until it passes (or `timeout` ms pass).
     * Put the action *and* its check inside, so each attempt is complete.
     *
     * @example
     * // Submit is sometimes ignored on the first click: click and check, repeat if needed
     * await this.wait.retry(async () => {
     *     await this.terminalSubmitButton.click()
     *     await expect(this.terminalSubmitButton).toBeHidden({ timeout: 3000 })
     * })
     *
     * @example
     * // Search results that arrive late: search again until the item shows up
     * await this.wait.retry(async () => {
     *     await this.giftCardSearchPageSearchInput.fill(itemCode)
     *     await expect(this.giftCardSearchPageItemLine.getByText(itemCode)).toBeVisible({ timeout: 2000 })
     * }, { timeout: 20000 })
     */
    async retry(action, { timeout = DEFAULT_TIMEOUT, intervals = [500, 1000, 2000] } = {}) {
        await expect(action).toPass({ timeout, intervals })
    }
}

module.exports = { WaitUtils }
