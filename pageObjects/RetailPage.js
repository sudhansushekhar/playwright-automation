const {expect} = require('@playwright/test')

class RetailPage{
    constructor(page){
    this.pageHeading = page.locator("h3[title='Retail']");

    // Sidebar
    this.retailButton = page.locator('a').filter({ hasText: /^Retail$/ });
    }

    async clickSidebarRetailButton(){
        await this.retailButton.click()
        await expect(this.pageHeading).toContainText("Retail");
    }
}

module.exports = {RetailPage};