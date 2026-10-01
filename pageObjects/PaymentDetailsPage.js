/**
 * PaymentDetailsPage
 * ------------------
 * "Transaction complete" screen after payment: read the receipt number
 * and start a new transaction.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class PaymentDetailsPage extends BasePage{
    constructor(page){
        super(page)

        // ── Locators ──────────────────────────────────────────────
        this.transactionCompletePanel = page.locator("div[id*='transaction_complete']")
        this.newTransaction = page.locator("[class*='new_invoice'] button")
        this.transactionMode = page.locator("[data-name*='transaction_mode'] span:nth-child(2)");

        // Receipt: 5th row holds "NO. : <invoice no>"
        this.transactionReceipt = page.locator("[data-name*='transaction_receipt']")
        this.transactionNoSection = page.locator("[id='page-pos-interface'] table tbody tr:nth-child(5) td")
    }

    // ── Dynamic locators ──────────────────────────────────────────

    selectPaymentOnPaymentDetail(paymentType) {
        return this.page.getByText(paymentType, { exact: true });
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Return the POS invoice number printed on the receipt, e.g. "ACC-PSINV-2026-02224". */
    async captureTransactionNo(){
        await expect(this.transactionReceipt).toBeVisible()
        // The receipt is drawn first and the invoice number is filled in afterwards
        await this.wait.waitForText(this.transactionNoSection, /NO\.\s*:\s*\S+/)
        const transactionSectionText = await this.transactionNoSection.textContent()

        const transactionNo = transactionSectionText.split(':')[1].split('\n')[0].trim()
        console.log(`Transaction No: ${transactionNo}`)
        return transactionNo
    }

    /** Close the receipt and return to an empty sale. */
    async clickNewTransaction(){
        await expect(this.transactionCompletePanel).toBeVisible()
        await this.newTransaction.click()
        await this.page.waitForLoadState('networkidle')
        await expect(this.transactionMode).toHaveText("Sale")
    }
}

module.exports = {PaymentDetailsPage};
