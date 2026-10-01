/**
 * OpeningAmountPopup
 * ------------------
 * "Opening Amount" popup shown when a new shift starts on the terminal.
 * If a shift is already open the popup does not appear and the POS dashboard loads directly.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class OpeningAmountPopup extends BasePage{
    constructor(page){
        super(page)

        // ── Locators ──────────────────────────────────────────────
        this.openingAmountWindow = page.locator("smart-window #open_shift_windowHeader");
        this.posTerminalInOpeningAmountPopup = page.locator('input[name="pos_terminal"]')

        // Denomination grid: second row is the tender being counted
        this.targetTenderRow = page.locator("smart-grid-row:nth-child(2)")
        this.targetTenderColumnCount = this.targetTenderRow.locator(`div[data-field='count']`)
        this.targetTenderColumnInput = this.targetTenderColumnCount.locator(`input`)
        this.targetTenderColumnAmount = this.targetTenderRow.locator(`div[data-field='amount']`)

        this.totalOpeningAmountValue = page.locator('input[name="opening_amount"]')
        this.startSellingButton = page.getByText('Start Selling')
    }

    // ── Actions ───────────────────────────────────────────────────

    /** The popup renders a moment after the terminal is selected; give it time before deciding. */
    async verifyOpeningAmountPopup(){
        return await this.wait.isVisibleWithin(this.openingAmountWindow, 3 * 1000);
    }

    /**
     * Enter the count for one denomination, check the calculated amounts and start the shift.
     * Does nothing when the popup is not shown (shift already open).
     */
    async fillOpeningAmount(terminalName, denominationColumnName, denominationCountValue){
        const isVisible = await this.verifyOpeningAmountPopup()
        if(!isVisible){
            console.log("ℹ️ Opening Shift window did not appear - shift already open");
            return
        }

        console.log("👉 Opening Shift window detected - entering opening amount");
        await expect(this.openingAmountWindow).toContainText('Opening Amount');
        await expect(this.posTerminalInOpeningAmountPopup).toHaveValue(`${terminalName}`);

        const calculatedAmount = parseInt(denominationColumnName) * parseInt(denominationCountValue)

        await this.targetTenderColumnCount.click();
        await this.targetTenderColumnInput.fill(denominationCountValue.toString());
        await this.targetTenderColumnInput.press('Tab');

        // The grid recalculates after Tab; these assertions wait for the new amounts
        await expect(this.targetTenderColumnAmount).toContainText(calculatedAmount.toString());
        await expect(this.totalOpeningAmountValue).toHaveValue(calculatedAmount.toString());

        await this.startSellingButton.click();
        await expect(this.openingAmountWindow).toBeHidden();
    }
}

module.exports = {OpeningAmountPopup};
