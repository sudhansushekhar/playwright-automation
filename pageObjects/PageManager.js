const {LoginPage} = require('../pageObjects/LoginPage')
const {HomePage} = require('../pageObjects/HomePage')
const {RetailPage} = require('../pageObjects/RetailPage')
const {PosTerminalPopup} = require('../pageObjects/PosTerminalPopup')
const {PosTerminalListPage} = require('../pageObjects/PosTerminalListPage')
const {OpeningAmountPopup} = require('../pageObjects/OpeningAmountPopup')
const {PosDashboardPage} = require('../pageObjects/PosDashboardPage')
const {PosDashboardMenu} = require('../pageObjects/PosDashboardMenu')
const {GiftCardSearchPage} = require('../pageObjects/GiftCardSearchPage')
const {PaymentDetailsPage} = require('../pageObjects/PaymentDetailsPage')
const {GiftCardListPage} = require('../pageObjects/GiftCardListPage')

class PageManager {

    constructor(page){
        this.page = page
    }


    getLoginPage(customPage){ return new LoginPage(customPage); }
    getHomePage(customPage) { return new HomePage(customPage); }
    getPosTerminalListPage(customPage) { return new PosTerminalListPage(customPage); }
    getRetailPage(customPage) { return new RetailPage(customPage); }
    getPosTerminalPopup(customPage) { return new PosTerminalPopup(customPage); }
    getOpeningAmountPopup(customPage) { return new OpeningAmountPopup(customPage); }
    getPosDashboardPage(customPage) { return new PosDashboardPage(customPage); }
    getPosDashboardMenu(customPage) { return new PosDashboardMenu(customPage); }
    getGiftCardSearchPage(customPage) { return new GiftCardSearchPage(customPage); }
    getPaymentDetailsPage(customPage) { return new PaymentDetailsPage(customPage); }
    getGiftCardListPage(customPage) { return new GiftCardListPage(customPage); }
}

module.exports = {PageManager}