/**
 * PosDashboardPage
 * ----------------
 * Main POS transaction screen: transaction mode, item grid, quick payment
 * and the "complete transaction" confirmation popup.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class PosDashboardPage extends BasePage{
    constructor(page){
        super(page)

        // ── Locators: header ──────────────────────────────────────
        this.transactionMode = page.locator("[data-name*='transaction_mode'] span:nth-child(2)");

        // ── Locators: transaction grid ────────────────────────────
        this.transactionGridSelectedRow = page.locator("smart-grid-row[aria-selected='true']")

        // ── Locators: quick payment ───────────────────────────────
        this.quickCashButton = page.locator("smart-button[class*='quick_cash'] button")

        // ── Locators: confirmation popup ──────────────────────────
        this.confirmPopup = page.locator("smart-window [smart-id='headerSection'] ")
        this.confirmPopupText = page.locator("smart-window [id='formWindowContent'] h4")
        this.confirmPopupYesButton = page.locator("ivend-button[id='yes'] button")
        this.confirmPopupNoButton = page.locator("ivend-button[id='no'] button")
    }

    // ── Dynamic locators ──────────────────────────────────────────

    transactionGridSelectedItem(itemCode) {
        return this.transactionGridSelectedRow.locator(`[data-field='item_code'][title='${itemCode}']`);
    }

    // ── Assertions ────────────────────────────────────────────────

    /** Override (polymorphism): the POS sale screen is ready. Opened via RetailPage.openPosInterface(). */
    async verifyPageLoaded(){
        await expect(this.page).toHaveTitle('iVendNext Point of Sale');
        await expect(this.transactionMode).toBeVisible();
    }

    async verifyTransactionMode(transactionMode){
        await expect(this.transactionMode).toBeVisible();
        console.log(`Transaction mode: ${(await this.transactionMode.innerText()).trim()}`);
        await expect(this.transactionMode).toContainText(transactionMode)
    }

    async verifyItemAddedToTransaction(itemCode){
        await expect(this.transactionGridSelectedItem(itemCode)).toBeVisible()
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Confirm "Are you sure you want to complete the transaction?" when it is shown. */
    async clickConfirmPopupYesButton(){
        // The popup opens shortly after the payment click - a one-time check could miss it
        if(!(await this.wait.isVisibleWithin(this.confirmPopup, 5 * 1000))){
            console.log("Confirmation popup not shown")
            return
        }

        await this.wait.waitForText(this.confirmPopupText, /\S/)    // text is filled in after the window opens
        const popupText = (await this.confirmPopupText.innerText()).trim();
        console.log(`Confirmation popup: ${popupText}`)
        if(popupText === "Are you sure you want to complete the transaction?"){
            await this.confirmPopupYesButton.click()
            await this.page.waitForLoadState('networkidle')
        }
    }

    /** Pay the full amount in cash and confirm. */
    async quickPayment(){
        await this.quickCashButton.click()
        await this.clickConfirmPopupYesButton()
    }
}

module.exports = {PosDashboardPage};
