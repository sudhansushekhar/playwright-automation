/**
 * PosInvoicePage
 * --------------
 * Desk › POS Invoice form. Used to check in the UI an invoice that was
 * created through the API (WebAndAPI spec).
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class PosInvoicePage extends BasePage{
    constructor(page){
        super(page)

        // ── Locators ──────────────────────────────────────────────
        this.posInvoicePage = page.locator("[id='page-List/POS Invoice/List']")
        this.posInvoicePageHeading = this.posInvoicePage.locator("h3")
        this.formHeading = page.locator("[id='page-POS Invoice'] h3")
        this.statusPill = page.locator("[id='page-POS Invoice'] .indicator-pill")
        this.customerValue = page.locator("[data-fieldname='customer'] .control-value")
        this.grandTotalValue = page.locator("[data-fieldname='grand_total'] .control-value")
    }

    // ── Actions ───────────────────────────────────────────────────

    /**
     * Override (polymorphism): an invoice form needs the invoice number, so this page
     * extends open() - it sets the path, then reuses the parent's template method via super.
     */
    async open(invoiceNo){
        this.path = `app/pos-invoice/${invoiceNo}`
        await super.open()
    }

    /** Override (polymorphism): the invoice form has rendered. */
    async verifyPageLoaded(){
        await this.waitForNetworkIdle()
        await expect(this.formHeading).toBeVisible()
    }

    /** The form shows the expected customer, total and a submitted status. */
    async verifyInvoice({ invoiceNo, customerName, customerCode, grandTotal }){
        await expect(this.page).toHaveTitle(`${customerName} - ${invoiceNo}`)
        await expect(this.formHeading).toHaveText(customerName)
        await expect(this.customerValue).toHaveText(customerCode)
        await expect(this.grandTotalValue).toContainText(grandTotal.toString())
        await expect(this.statusPill).not.toHaveText('Draft')
    }
}

module.exports = {PosInvoicePage};
