/**
 * PosTerminalListPage
 * -------------------
 * Desk › POS Terminal list and form.
 * Main job: release the shared test terminal so the POS "Select POS Terminal"
 * dropdown offers it again (a terminal bound to another browser is hidden).
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class PosTerminalListPage extends BasePage{
    constructor(page){
        super(page)
        this.path = 'app/pos-terminal'

        // ── Locators: list view ───────────────────────────────────
        this.posTerminalPage = page.locator("[id='page-List/POS Terminal/List']")
        this.posTerminalPageHeading = this.posTerminalPage.locator("h3")
        this.clearFilterXButton = page.locator("[title='Clear all filters']")
        this.addPosTerminalButton = page.getByRole('button', { name: 'Add POS Terminal' })

        // ── Locators: terminal form ───────────────────────────────
        this.hardwareId = page.locator("div[data-fieldname='hardware_id'] div[class*='control-value']")
        this.saveButton = page.getByRole('button', { name: 'Save' })
        this.releaseTerminalButton = page.getByRole('button', {name : /Release Terminal/i})
    }

    // ── Dynamic locators ──────────────────────────────────────────

    posTerminalLink(terminalName) {
        return this.page.locator(`div.result div.list-row-container a[data-name='${terminalName}']`);
    }

    posTerminalByName(terminalName) {
        return this.page.getByRole('link', {name : terminalName})
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): the POS Terminal list is ready. */
    async verifyPageLoaded(){
        await expect(this.addPosTerminalButton).toBeVisible()
    }

    async clearAllFilters(){
        await this.clearFilterXButton.click()
        await this.page.waitForLoadState('networkidle');
        console.log("All POS Terminal filters cleared")
    }

    /** The "Release Terminal" button is only shown while the terminal is bound (it renders after the form). */
    async clickReleaseTerminal(){
        if(await this.wait.isVisibleWithin(this.releaseTerminalButton, 3 * 1000)){
            console.log("Terminal is bound - releasing it")
            await this.releaseTerminalButton.click()
        } else {
            console.log("Terminal is already released")
        }
    }

    async verifyTerminalReleased(){
        await expect(this.releaseTerminalButton).not.toBeVisible();
    }

    /** Full flow: open the list, find the terminal, release it, verify. Safe to call when already released. */
    async releaseTerminal(terminalName){
        await this.open()

        await this.clearAllFilters()
        await this.posTerminalByName(terminalName).click()
        await expect(this.saveButton).toBeVisible()

        await this.clickReleaseTerminal()
        await this.verifyTerminalReleased()
    }
}

module.exports = {PosTerminalListPage};
