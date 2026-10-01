const {expect} = require('@playwright/test')

class PosDashboardPage{
    constructor(page){
    this.page = page
    this.transactionMode = page.locator("[data-name*='transaction_mode'] span:nth-child(2)");

    // Item Panel

    // Customer Panel

    // Transaction Table
    this.transactionGridSelectedRow = page.locator("smart-grid-row[aria-selected='true']")



    // Cart Summary

    // Quick Payment
    this.paymentInterfaceBlock = page.locator("smart-button[data_parameter_1*='Payment Interface]")
    this.quickCashButton = page.locator("smart-button[class*='quick_cash'] button")
    
    // Confirm POpup
    this.confirmPopup = page.locator("smart-window [smart-id='headerSection'] ")
    this.confirmPopupText = this.page.locator("smart-window [id='formWindowContent'] h4")
    this.confirmPopupYesButton = this.page.locator("ivend-button[id='yes'] button")
    this.confirmPopupNoButton = this.page.locator("ivend-button[id='no'] button")

    }

    // Define a dynamic locator me
    transactionGridSelectedItem(itemCode) {
        return this.transactionGridSelectedRow.locator(`[data-field='item_code'][title='${itemCode}']`);
    }

    async verifyPosInterface(){
        await expect(this.page).toHaveTitle('iVendNext Point of Sale');
    }

    async verifyTransactionMode(transactionMode){
        await expect(this.transactionMode).toBeVisible();
        const transactionModeCaptured = await this.transactionMode.innerText();
        console.log(`Transaction Mode Captured: ${transactionModeCaptured.trim()}`);
        await expect(this.transactionMode).toContainText(transactionMode)
    }

    async verifyItemAddedToTransaction(itemCode){
        await expect(this.transactionGridSelectedItem(itemCode)).toBeVisible()
    }

    async clickConfirmPopupYesButton(){
        if(await this.confirmPopup.isVisible()){
            console.log("Quick Cash Popup Found")
            
            const popupText = await this.confirmPopupText.innerText();
            console.log(`Popup Text : ${popupText}`)
            if("Are you sure you want to complete the transaction?" == popupText.trim()){
                await this.confirmPopupYesButton.click()
            await this.page.waitForLoadState('networkidle')
            }
            
        } else{
            console.log("Quick Cash Popup Not Found!!")
        }
        
    }

    async quickPayment(){
        await this.quickCashButton.click()
        await this.clickConfirmPopupYesButton()
    }
}

module.exports = {PosDashboardPage};