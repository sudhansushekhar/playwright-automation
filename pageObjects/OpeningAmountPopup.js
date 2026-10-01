const {expect} = require('@playwright/test')

class OpeningAmountPopup{
    constructor(page){
    this.page = page
    this.openingAmountWindow = page.locator("smart-window #open_shift_windowHeader");

    this.posTerminalInOpeningAmountPopup = page.locator('input[name="pos_terminal"]')
    this.targetTenderRow = page.locator("smart-grid-row:nth-child(2)")
    this.targetTenderColumnCount = this.targetTenderRow.locator(`div[data-field='count']`)
    this.targetTenderColumnInput = this.targetTenderColumnCount.locator(`input` )
    this.targetTenderColumnAmount = this.targetTenderRow.locator(`div[data-field='amount']`)
    this.totalOpeningAmountValue = page.locator('input[name="opening_amount"]')
    this.startSellingButton = page.getByText('Start Selling')
    }

    async verifyOpeningAmountPopup(){
        return await this.openingAmountWindow.isVisible();
    }

    async fillOpeningAmount(terminalName, denominationColumnName, denominationCountValue){
        const isVisible = await this.verifyOpeningAmountPopup()
        if(isVisible){     
            console.log("👉 Opening Shift Window detected. Processing shift amounts...");   
            await expect(this.openingAmountWindow).toContainText('Opening Amount'); 

            const calculatedAmount = parseInt(denominationColumnName) * parseInt(denominationCountValue)
            await expect(this.posTerminalInOpeningAmountPopup).toHaveValue(`${terminalName}`);

            await this.targetTenderColumnCount.click();
            await this.targetTenderColumnInput.fill(denominationCountValue.toString());
            await this.targetTenderColumnInput.press('Tab');
            await this.page.waitForTimeout(500);
            
            await expect(this.targetTenderColumnAmount).toContainText(calculatedAmount.toString());
            await expect(this.totalOpeningAmountValue).toHaveValue(calculatedAmount.toString());
            await this.startSellingButton.click();
            
            await expect(this.openingAmountWindow).toBeHidden();

        }else {
            console.log("ℹ️ Opening Shift Window did not appear. Moving straight to POS Dashboard.");
        }
    }
}

module.exports = {OpeningAmountPopup};