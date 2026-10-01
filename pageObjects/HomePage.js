const {expect} = require('@playwright/test')

class HomePage{
    constructor(page){
    this.page = page
    this.pageHeading = page.locator("h3[title='Retail']");
    this.userLink = page.locator("a[class*='dropdown-user-link']");
    this.logoutButton = page.locator('.dropdown-item').filter({ hasText: 'Log out' });
    // Sidebar
    this.retailButton = page.locator("[class*='side-menu-icons'] li[data-module='Retail'] a");
    }

    async clickSidebarRetailButton(){
        await this.retailButton.click()
        await expect(this.pageHeading).toContainText("Retail");
        await expect(this.page).toHaveTitle('Retail')
    }

    async logoutFromApplication(){
        await this.userLink.click()
        await expect(this.logoutButton).toBeVisible()
        await this.logoutButton.click()
        await expect(this.page).toHaveTitle('Login')
    }
}

module.exports = {HomePage};