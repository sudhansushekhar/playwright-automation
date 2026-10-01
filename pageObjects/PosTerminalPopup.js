/**
 * PosTerminalPopup
 * ----------------
 * "Select POS Terminal" popup shown when the POS opens in a browser
 * that is not yet bound to a terminal.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class PosTerminalPopup extends BasePage{
    constructor(page){
        super(page)

        // ── Locators ──────────────────────────────────────────────
        this.posTerminalWindow = page.getByRole('heading', { name: 'Select POS Terminal' });
        this.posWindowHeader = page.locator('#pos_terminal_windowHeader');
        this.terminalDropdown = page.locator("smart-drop-down-list[name='pos_terminal_name']");
        this.terminalSubmitButton = page.getByText('Submit')
    }

    // ── Dynamic locators ──────────────────────────────────────────

    terminalInDropdown(terminalName) {
        return this.page.getByText(terminalName, { exact: true });
    }

    // ── Actions ───────────────────────────────────────────────────

    /**
     * Override (polymorphism): the "Select POS Terminal" popup is shown.
     * Wait for the popup: the POS app needs a few seconds to boot (≈5s on WebKit).
     * If it still has not rendered, reload once as a fallback.
     */
    async verifyPageLoaded(){
        const appeared = await this.wait.isVisibleWithin(this.posTerminalWindow, 10 * 1000);

        if(!appeared){
            console.log("⚠️ POS Terminal window not rendered - reloading page");
            await this.page.reload()
            await this.page.waitForLoadState('load');
            await expect(this.posTerminalWindow).toBeVisible({ timeout: 20 * 1000 })
        }

        await expect(this.posWindowHeader).toContainText('Select POS Terminal');
        console.log("✅ POS Terminal window detected");
    }

    async selectPosTerminal(terminalName){
        await this.terminalDropdown.click();
        await this.terminalInDropdown(terminalName).click();
        await expect(this.terminalDropdown.locator("#pos_terminal_nameActionButton")).toContainText(terminalName);

        // The smart dropdown commits its value asynchronously; submitting too early is ignored
        await this.wait.waitForDomToSettle({ quietMs: 500 });
        await this.terminalSubmitButton.click();

        // Submit stays on screen (faded) while the terminal is applied
        await this.wait.waitForHidden(this.terminalSubmitButton, 20 * 1000);
        await this.wait.waitForNetworkIdle();
        await this.wait.waitForDomToSettle({ quietMs: 1000 });
    }
}

module.exports = {PosTerminalPopup};
