const {expect} = require('@playwright/test')

class PaymentDetailsPage{
    constructor(page){
    this.page = page


    // Transaction Complete
    this.transactionCompletePanel = page.locator("div[id*='transaction_complete']")
    this.newTransaction = page.locator("[class*='new_invoice'] button")
    this.transactionMode = page.locator("[data-name*='transaction_mode'] span:nth-child(2)");

    this.transactionReceipt = page.locator("[data-name*='transaction_receipt']")
    this.transactionNoSection = page.locator("[id='page-pos-interface'] table tbody tr:nth-child(5) td")


    }

    // Define a dynamic locator
    selectPaymentOnPaymentDetail(paymentType) {
        return this.page.getByText(paymentType, { exact: true });
    }

    async captureTransactionNo(){
        await this.transactionReceipt.isVisible()
        const transactionSectionText = await this.transactionNoSection.textContent()
        console.log(`Captured Transaction Contents: ${transactionSectionText}`)

        const transactionNo = transactionSectionText.split(':')[1].split('\n')[0].trim()
        console.log(`Transaction No: ${transactionNo}`)

        return transactionNo
    }

    async clickNewTransaction(){
        await expect(this.transactionCompletePanel).toBeVisible()
        await this.newTransaction.click()
        await this.page.waitForLoadState('networkidle')
        await expect(this.transactionMode).toHaveText("Sale")
    }
}

module.exports = {PaymentDetailsPage};