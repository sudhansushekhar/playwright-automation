/**
 * RetailPage
 * ----------
 * Retail workspace in Desk. Entry point to the POS application,
 * which opens in a new browser tab.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class RetailPage extends BasePage{
    constructor(page){
        super(page)
        this.path = 'app/retail'

        // ── Locators ──────────────────────────────────────────────
        this.pageHeading = page.locator("h3[title='Retail']");
        this.retailButton = page.locator('a').filter({ hasText: /^Retail$/ });
        this.posInterfaceLink = page.getByRole('link', { name: 'iVendNext POS' });
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): Retail workspace with the POS link. */
    async verifyPageLoaded(){
        await expect(this.pageHeading).toContainText("Retail");
        await expect(this.posInterfaceLink).toBeVisible();
    }

    async clickSidebarRetailButton(){
        await this.retailButton.click()
        await expect(this.pageHeading).toContainText("Retail");
    }

    /**
     * Click "iVendNext POS" and return the POS tab that opens.
     * Start waiting for the popup before clicking, so the event is not missed.
     */
    async openPosInterface(){
        const posPagePromise = this.page.waitForEvent('popup');
        await this.posInterfaceLink.click();
        const posPage = await posPagePromise;
        await posPage.waitForLoadState('load');
        return posPage;
    }
}

module.exports = {RetailPage};
