/**
 * PosDashboardMenu
 * ----------------
 * Function-button panels on the POS screen (Action / Customer / Transaction).
 * Each panel button swaps the button grid; the target button is then clicked.
 */
const {BasePage} = require('./BasePage')

class PosDashboardMenu extends BasePage{
    constructor(page){
        super(page)

        // ── Locators: panel switchers ─────────────────────────────
        this.actionPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Action Button Panel'] button");
        this.customerPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Customer Button Panel'] button");
        this.transactionPanelButton = page.locator("ivend-dynamic-button[data_parameter_1*='Transaction Button Panel'] button");

        // ── Locators: Action panel ────────────────────────────────
        this.voidTransactionButton = page.locator("ivend-dynamic-button[class*='void_transaction'] button");

        // ── Locators: Transaction panel ───────────────────────────
        this.giftCardButton = page.locator("ivend-dynamic-button[data_parameter_1*='gift_card_sale'] button");
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Transaction panel → Gift Card (opens the Gift Card Sale search). */
    async clickGiftCardButton(){
        await this.transactionPanelButton.click()
        await this.page.waitForLoadState('networkidle');
        await this.giftCardButton.click()
    }

    /** Action panel → Void Transaction (used by the recovery hook). */
    async clickVoidTransactionButton(){
        await this.actionPanelButton.click()
        await this.page.waitForLoadState('networkidle');
        await this.voidTransactionButton.click()
    }
}

module.exports = {PosDashboardMenu};
