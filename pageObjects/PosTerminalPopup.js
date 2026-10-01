const {expect} = require('@playwright/test')

class PosTerminalPopup{
    constructor(page){
    this.page = page
    this.posTerminalWindow = page.getByRole('heading', { name: 'Select POS Terminal' });
    this.posWindowHeader = page.locator('#pos_terminal_windowHeader');
    this.terminalDropdown = page.locator("smart-drop-down-list[name='pos_terminal_name']");
    this.terminalSubmitButton = page.getByText('Submit')

    }

    // Define a dynamic locator me
    terminalInDropdown(terminalName) {
        // return this.page.locator('div').filter({ hasText: terminalName });
        return this.page.getByText(terminalName, { exact: true });
    }

    async verifyPosTerminalPopup(){
        const isWindowVisible = await this.posTerminalWindow.isVisible();

        if(!isWindowVisible){
            console.log("⚠️ POS Terminal window is hidden or not rendered. Refreshing page...");

            await this.page.reload()
            await this.page.waitForLoadState('load');

            await expect(this.posTerminalWindow).toBeVisible()
            await expect(this.posWindowHeader).toContainText('Select POS Terminal');

        } else {
            console.log("✅ POS Terminal window detected successfully.");
        }
    }

    async selectPosTerminal(terminalName){
        await this.terminalDropdown.click();
        await this.terminalInDropdown(terminalName).click();
        await expect(this.terminalDropdown.locator("#pos_terminal_nameActionButton")).toContainText(terminalName);
        await this.page.waitForTimeout(500);
        await this.terminalSubmitButton.click();
        
        await this.terminalSubmitButton.waitFor({ state: 'hidden', timeout: 5000 });
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForTimeout(1000);
    }
}

module.exports = {PosTerminalPopup};