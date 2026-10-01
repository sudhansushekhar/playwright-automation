/**
 * GiftCardListPage
 * ----------------
 * Desk › Gift Card list: filter the list (e.g. by POS Invoice), open a gift card
 * and read its balance.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class GiftCardListPage extends BasePage{
    constructor(page){
        super(page)
        this.path = 'app/gift-card'

        // Promise for the list reload, started in fillFilterDetails() and awaited in applyFilters()
        this.reportViewResponse = null;

        // ── Locators: list view ───────────────────────────────────
        this.giftCardPage = page.locator("[id='page-List/Gift Card/List']")
        this.giftCardPageHeading = this.giftCardPage.locator("h3")
        this.clearFilterXButton = this.giftCardPage.locator("[title='Clear all filters']")
        this.filterButton = this.giftCardPage.locator("[class*='filter-button']")
        this.applyFiltersButton = page.locator(".filter-action-buttons button[class*='apply-filters']")
        this.giftCardSerialNos = page.locator("div[class='result'] div[class='list-row-container'] a[data-doctype='Gift Card']")

        // ── Locators: filter popup ────────────────────────────────
        this.filterField = page.locator("div[class*='list_filter']").last()
        this.filterFieldInput = this.filterField.locator("input[role='combobox']").first()
        this.filterFieldOption = this.filterField.locator("ul[role='listbox']:not([hidden])")
        this.filterCondition = this.filterField.locator("select[class*='condition']")

        // ── Locators: gift card form ──────────────────────────────
        this.currencyValue = page.locator("div[data-fieldname='balance'] [data-fieldtype='Currency']")
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): the Gift Card list is shown. */
    async verifyPageLoaded(){
        await expect(this.page).toHaveTitle("Gift Card")
        await expect(this.giftCardPageHeading).toHaveText("Gift Card")
    }

    async clearAllFilters(){
        await this.clearFilterXButton.click()
        await this.page.waitForLoadState('networkidle')
    }

    async addFilter(){
        await this.filterButton.click()
    }

    /**
     * Fill one filter row, e.g. ("POS Invoice", "Equals", "ACC-PSINV-2026-02224").
     * The field's input is found by its fieldname ("POS Invoice" → "pos_invoice").
     */
    async fillFilterDetails(fieldName, filterCondition, filterConditionValue){
        const fieldValue = fieldName.toLowerCase().replace(" ", "_");

        await this.filterFieldInput.fill(fieldName)
        await this.filterFieldOption.getByText(fieldName, { exact: true }).click();
        await this.filterCondition.selectOption({ label: filterCondition })

        const filterConditionInput = this.filterField.locator(`input[data-fieldname='${fieldValue}']`)
        await filterConditionInput.clear()

        // Start listening before typing so the list reload is not missed
        this.reportViewResponse = this.page.waitForResponse(response =>
            response.url().includes("api/method/frappe.desk.reportview.get") && response.status() === 200
        );

        await filterConditionInput.fill(filterConditionValue)
        const filterConditionInputValue = this.filterFieldOption.locator(`p[title='${filterConditionValue}']`)
        await filterConditionInputValue.getByText(filterConditionValue, { exact: true }).click();
        await this.page.waitForLoadState('networkidle')
    }

    async applyFilters(){
        await this.applyFiltersButton.click()
        await this.reportViewResponse;
    }

    /** Open the first gift card in the filtered list. */
    async clickFilteredSerialNo(){
        const serialNo = await this.giftCardSerialNos.first().textContent()
        console.log(`Gift card serial no: ${serialNo}`)

        await this.giftCardSerialNos.first().click()
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForLoadState('domcontentloaded')
    }

    async getGiftCardBalanceValue(){
        await this.wait.waitForValue(this.currencyValue)     // the form fills the field after it opens
        const balanceValue = await this.currencyValue.inputValue()
        console.log(`Gift card balance: ${balanceValue}`)
        return balanceValue
    }
}

module.exports = {GiftCardListPage};
