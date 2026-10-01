/**
 * PageManager
 * -----------
 * Single entry point to all page objects (factory + composition).
 * Create one per browser tab:
 *
 *   const deskPM = new PageManager(deskPage)
 *   await deskPM.getHomePage().clickSidebarRetailButton()
 *
 * Every getter uses the manager's own tab by default and accepts another tab when needed.
 */
const {LoginPage} = require('./LoginPage')
const {HomePage} = require('./HomePage')
const {RetailPage} = require('./RetailPage')
const {PosTerminalListPage} = require('./PosTerminalListPage')
const {PosTerminalPopup} = require('./PosTerminalPopup')
const {OpeningAmountPopup} = require('./OpeningAmountPopup')
const {PosDashboardPage} = require('./PosDashboardPage')
const {PosDashboardMenu} = require('./PosDashboardMenu')
const {GiftCardSearchPage} = require('./GiftCardSearchPage')
const {PaymentDetailsPage} = require('./PaymentDetailsPage')
const {GiftCardListPage} = require('./GiftCardListPage')
const {PosInvoicePage} = require('./PosInvoicePage')

class PageManager {
    constructor(page){
        this.page = page
    }

    // ── Desk (back office) ────────────────────────────────────────
    getLoginPage(customPage = this.page) { return new LoginPage(customPage); }
    getHomePage(customPage = this.page) { return new HomePage(customPage); }
    getRetailPage(customPage = this.page) { return new RetailPage(customPage); }
    getPosTerminalListPage(customPage = this.page) { return new PosTerminalListPage(customPage); }
    getGiftCardListPage(customPage = this.page) { return new GiftCardListPage(customPage); }
    getPosInvoicePage(customPage = this.page) { return new PosInvoicePage(customPage); }

    // ── POS (point of sale tab) ───────────────────────────────────
    getPosTerminalPopup(customPage = this.page) { return new PosTerminalPopup(customPage); }
    getOpeningAmountPopup(customPage = this.page) { return new OpeningAmountPopup(customPage); }
    getPosDashboardPage(customPage = this.page) { return new PosDashboardPage(customPage); }
    getPosDashboardMenu(customPage = this.page) { return new PosDashboardMenu(customPage); }
    getGiftCardSearchPage(customPage = this.page) { return new GiftCardSearchPage(customPage); }
    getPaymentDetailsPage(customPage = this.page) { return new PaymentDetailsPage(customPage); }
}

module.exports = {PageManager}
