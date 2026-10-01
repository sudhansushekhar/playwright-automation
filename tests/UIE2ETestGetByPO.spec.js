const {test, expect} = require('@playwright/test')
const {LoginPage} = require('../pageObjects/LoginPage')
const {HomePage} = require('../pageObjects/HomePage')
const {RetailPage} = require('../pageObjects/RetailPage')
const {PosTerminalPopup} = require('../pageObjects/PosTerminalPopup')
const {OpeningAmountPopup} = require('../pageObjects/OpeningAmountPopup')
const {PosDashboardPage} = require('../pageObjects/PosDashboardPage')
const {PosDashboardMenu} = require('../pageObjects/PosDashboardMenu')
const {GiftCardSearchPage} = require('../pageObjects/GiftCardSearchPage')
const {PaymentDetailsPage} = require('../pageObjects/PaymentDetailsPage')
const {GiftCardListPage} = require('../pageObjects/GiftCardListPage')


test.only('Gift Card Sale E2E test', async ({ page }) => {   
    // Playwright Code now
    const username = "cicd@citixsys.com";
    const password = "Pass@123";

    // Enter Details to login
    const loginPage = new LoginPage(page)
    await loginPage.goTo()
    await loginPage.validLogin(username, password)

    const homePage = new HomePage(page)
    await homePage.clickSidebarRetailButton()

    const retailPage = new RetailPage(page)
    await retailPage.clickSidebarRetailButton()

    // click 'iVendNext POS' to open new tab
    const interfacePagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'iVendNext POS' }).click();
    const interfacePage = await interfacePagePromise;

    // POS TERMINAL SELECTION
    const posTerminalPopup = new PosTerminalPopup(interfacePage)
    const terminalName = "CI-CD Terminal";
    await posTerminalPopup.verifyPosTerminalPopup(terminalName)
    
    // Select Terminal
    await posTerminalPopup.selectPosTerminal(terminalName)

    // POS OPENING ENTRY
    const openingAmountPopup = new OpeningAmountPopup(interfacePage)
    await openingAmountPopup.verifyOpeningAmountPopup()

    const denominationColumnName = '10';
    const denominationCountValue = '2';
    await openingAmountPopup.fillOpeningAmount(terminalName, denominationColumnName, denominationCountValue)
    

    // POS Dashboard Landing
    const posDashboardPage = new PosDashboardPage(interfacePage)
    await posDashboardPage.verifyPosInterface()

    await posDashboardPage.verifyTransactionMode('Sale')

    // GIFT CARD SALE
    // Click Gift Card 
    const posDashboardPageMenu = new PosDashboardMenu(interfacePage)
    
    await posDashboardPageMenu.clickGiftCardButton()

    const giftCardSearchPage = new GiftCardSearchPage(interfacePage)
    await giftCardSearchPage.verifyGiftCardPage()

    // Add Gift Card to transaction
    const giftCardItemCode = "GC-Gold-2025"
    await giftCardSearchPage.searchAndAddGiftCard(giftCardItemCode)
    
    // Gift card Added to POS as line Item
    await posDashboardPage.verifyItemAddedToTransaction(giftCardItemCode)

    // Do Quick Cash
    await posDashboardPage.quickPayment()

    // Get Transaction No
    const paymentDetailsPage = new PaymentDetailsPage(interfacePage)
    const transactionNo = await paymentDetailsPage.captureTransactionNo()
    await paymentDetailsPage.clickNewTransaction()

    // Swith back to previous page
    await page.bringToFront()
    await homePage.clickSidebarRetailButton()
    await page.waitForLoadState('domcontentloaded')


    // Gift Card List Page
    await loginPage.goTo('app/gift-card')
    
    const giftCardListPage = new GiftCardListPage(page)
    await giftCardListPage.verifyGiftCardPage()

    await giftCardListPage.clearAllFilters()

    await giftCardListPage.addFilter()

    await giftCardListPage.fillFilterDetails("POS Invoice", "Equals", transactionNo);

    await giftCardListPage.applyFilters()
    
    await giftCardListPage.clickFilteredSerialNo()

    await giftCardListPage.getGiftCardBalanceValue()


    // Switch back to POS Transaction Screen
    await interfacePage.bringToFront()
    
});
