/**
 * HomePage
 * --------
 * Desk home: sidebar navigation and the user menu.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class HomePage extends BasePage{
    constructor(page){
        super(page)
        this.path = 'app/home'

        // ── Locators ──────────────────────────────────────────────
        this.homeHeading = page.getByRole('heading', { name: 'Home' });
        this.retailHeading = page.locator("h3[title='Retail']");

        // Sidebar
        this.retailButton = page.locator("[class*='side-menu-icons'] li[data-module='Retail'] a");

        // User menu
        this.userLink = page.locator("a[class*='dropdown-user-link']");
        this.logoutButton = page.locator('.dropdown-item').filter({ hasText: 'Log out' });
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): Desk home is shown (the session comes from storageState). */
    async verifyPageLoaded(){
        await expect(this.page).toHaveTitle('Home')
        await expect(this.homeHeading).toBeVisible()
    }

    /** Sidebar → Retail workspace. */
    async clickSidebarRetailButton(){
        await this.retailButton.click()
        await expect(this.retailHeading).toContainText("Retail");
        await expect(this.page).toHaveTitle('Retail')
    }

    /**
     * User menu → Log out.
     * Note: logging out ends the session on the server, which also invalidates the
     * saved storageState. Only call it from a context that does not use that file.
     */
    async logoutFromApplication(){
        await this.userLink.click()
        await expect(this.logoutButton).toBeVisible()
        await this.logoutButton.click()
        await expect(this.page).toHaveTitle('Login')
    }
}

module.exports = {HomePage};
