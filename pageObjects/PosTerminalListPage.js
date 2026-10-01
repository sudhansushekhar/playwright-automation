const {expect} = require('@playwright/test')
const {LoginPage} = require('../pageObjects/LoginPage')

class PosTerminalListPage{
    constructor(page){
    this.page = page

    // POS Terminal Complete
    this.posTerminalPage = page.locator("[id='page-List/POS Terminal/List']")
    this.posTerminalPageHeading = this.posTerminalPage.locator("h3")
    this.clearFilterXButton = this.page.locator("[title='Clear all filters']")
    
    // Hardware Id
    this.addPosTerminalButton = this.page.getByRole('button', { name: 'Add POS Terminal' })
    this.hardwareId = this.page.locator("div[data-fieldname='hardware_id'] div[class*='control-value']")


    // Release Terminal Button
    this.saveButton = this.page.getByRole('button', { name: 'Save' })
    this.releaseTerminalButton = this.page.getByRole('button', {name : /Release Terminal/i})

    }

    // Define a dynamic locator
    posTerminalLink(terminalName) {
        return this.page.locator(`div.result div.list-row-container a[data-name='${terminalName}']`);
    }

    posTerminalByName(terminalName) {
        return this.page.getByRole('link', {name : terminalName})
    }

    async verifyPosTerminalPage(){
        await expect(this.page).toHaveTitle("POS Terminal")
        await expect(this.posTerminalPageHeading).toHaveText("POS Terminal")
    }

    async clearAllFilters(){
        await this.clearFilterXButton.click()
        await this.page.waitForLoadState('networkidle');
        console.log("All POS Terminal Filters CLeared")
    }

    async clickReleaseTerminal(){
        
        if(await this.releaseTerminalButton.isVisible()){
            console.log("Terminal not Released!!")
            await this.releaseTerminalButton.click()
            console.log("Clicked Release Terminal Button")
        } else {
            console.log("Terminal is already Released")
        }
        
    }

    async verifyTerminalReleased(){
        await expect(this.releaseTerminalButton).not.toBeVisible();
        
    }

    async releaseTerminal(terminalName){
        const loginPage = new LoginPage(this.page);
        await loginPage.goTo('app/pos-terminal');

        await expect(this.addPosTerminalButton).toBeVisible()

        await this.clearAllFilters()

        await this.posTerminalByName(terminalName).click()

        await expect(this.saveButton).toBeVisible()

        await this.clickReleaseTerminal()

        await this.verifyTerminalReleased()
    }

}

module.exports = {PosTerminalListPage};