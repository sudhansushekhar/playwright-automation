const {expect} = require('@playwright/test')

class PosDashboardMenu{
    constructor(page){
    this.page = page
    // Operation Panel Buttons
    this.actionPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Action Button Panel'] button");
    this.customerPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Customer Button Panel'] button");
    this.transactionPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Transaction Button Panel'] button");
    
    //Action Panel
    this.voidTransactionButton = page.locator("ivend-dynamic-button[class*='void_transaction'] button");

    //Customer Panel

    //Transaction Panel

    this.giftCardButton = page.locator("ivend-dynamic-button[data_parameter_1*='gift_card_sale'] button");


    }

    async clickGiftCardButton(){
        await this.transactionPanelButton.click()
        await this.page.waitForLoadState('networkidle');
        await this.giftCardButton.click()
    }

    async clickVoidTransactionButton(){
        await this.actionPanelButton.click()
        await this.page.waitForLoadState('networkidle');
        await this.voidTransactionButton.click()
    }

    async verifyTransactionMode(transactionMode){
        await expect(this.transactionMode).toBeVisible();
        const transactionModeCaptured = await this.transactionMode.innerText();
        console.log(`Transaction Mode Captured: ${transactionModeCaptured.trim()}`);
        await expect(this.transactionMode).toContainText(transactionMode)
    }
}

module.exports = {PosDashboardMenu};