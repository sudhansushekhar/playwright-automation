const {test, expect} = require('@playwright/test')
const { PageManager } = require('../pageObjects/PageManager')

// 1. Declare shared variables at the top of the file
let deskPage;
let posPage; // The POS tab where sales are conducted
let deskPM; // PageManager targeting deskPage
let posPM;  // PageManager targeting posPage

let transactionNo;
let terminalName;


test.describe.serial('Gift Card Sales', () => {
    // It tells Playwright: "On failure, do NOT skip the rest of the file."
    // test.describe.configure({ mode: 'default' }); 
    // 2. Setup runs ONCE before all tests start
    test.beforeAll(async ({ browser }) => {
        // Manually build context to prevent Playwright from auto-closing tabs
        const context = await browser.newContext();
        deskPage = await context.newPage();

        deskPM = new PageManager(deskPage);

        const username = "cicd";
        const password = "Pass@123";
        terminalName = "CI-CD Terminal";

        // Initial application entry
        await deskPM.getLoginPage(deskPage).goTo();
        await deskPM.getLoginPage(deskPage).validLogin(username, password);

        await deskPM.getPosTerminalListPage(deskPage).releaseTerminal(terminalName)

        await deskPM.getHomePage(deskPage).clickSidebarRetailButton();

        // Spawn and lock focus onto the iVendNext POS Tab
        const posPagePromise = deskPage.waitForEvent('popup');
        await deskPage.getByRole('link', { name: 'iVendNext POS' }).click();
        posPage = await posPagePromise;

        posPM = new PageManager(posPage);

        // Walk through the setup popups
        await posPM.getPosTerminalPopup(posPage).verifyPosTerminalPopup(terminalName);
        await posPM.getPosTerminalPopup(posPage).selectPosTerminal(terminalName);

        await posPM.getOpeningAmountPopup(posPage).verifyOpeningAmountPopup();
        await posPM.getOpeningAmountPopup(posPage).fillOpeningAmount(terminalName, '10', '2');

        await posPM.getPosDashboardPage(posPage).verifyPosInterface();
        await posPM.getPosDashboardPage(posPage).verifyTransactionMode('Sale')
    });

    
    test('TC-01 Gift Card Sale E2E test', async () => {  
        // GIFT CARD SALE
        // Click Gift Card 
        
        await posPM.getPosDashboardMenu(posPage).clickGiftCardButton()

        await posPM.getGiftCardSearchPage(posPage).verifyGiftCardPage()

        // Add Gift Card to transaction
        const giftCardItemCode = "GC-Gold-2025"
        await posPM.getGiftCardSearchPage(posPage).searchAndAddGiftCard(giftCardItemCode)
        
        // Gift card Added to POS as line Item
        await posPM.getPosDashboardPage(posPage).verifyItemAddedToTransaction(giftCardItemCode)

        // Do Quick Cash
        await posPM.getPosDashboardPage(posPage).quickPayment()

        // Get Transaction No
        transactionNo = await posPM.getPaymentDetailsPage(posPage).captureTransactionNo()
        await posPM.getPaymentDetailsPage(posPage).clickNewTransaction()
     
    });

    test('TC-02 Verify Gift Card Details', async () => {  
        // Swith back to previous page
        await deskPage.bringToFront()

        // 3. Navigate and run validations using the captured transaction number
        await deskPM.getLoginPage(deskPage).goTo('app/gift-card')
        
        await deskPM.getGiftCardListPage(deskPage).verifyGiftCardPage()
        await deskPM.getGiftCardListPage(deskPage).clearAllFilters()
        await deskPM.getGiftCardListPage(deskPage).addFilter()

        await deskPM.getGiftCardListPage(deskPage).fillFilterDetails("POS Invoice", "Equals", transactionNo);

        await deskPM.getGiftCardListPage(deskPage).applyFilters()
        await deskPM.getGiftCardListPage(deskPage).clickFilteredSerialNo()
        await deskPM.getGiftCardListPage(deskPage).getGiftCardBalanceValue()

        // Switch back to POS Transaction Screen
        await posPage.bringToFront()
        
    });

    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status === 'failed') {
            console.error(`❌ Test "${testInfo.title}" failed. Triggering transaction recovery loop...`);

            try {
                // Focus the POS tab immediately
                await posPage.bringToFront()
                await posPage.reload();
                await posPage.waitForLoadState('networkidle')
               

                // Void Transaction
                await posPM.getPosDashboardMenu(posPage).clickVoidTransactionButton()

                await posPM.getPosDashboardPage(posPage).clickConfirmPopupYesButton()
                    
                console.log("✅ Transaction successfully voided. Canvas reset for the next test.");
                
            } catch (recoveryError) {
                console.error("🚨 Critical Error: Recovery cleanup block failed to reset the UI!", recoveryError);
            }
        }
    });

    test.afterAll(async () => {
        // Swith back to previous page
        await deskPage.bringToFront()
        await deskPM.getPosTerminalListPage(deskPage).releaseTerminal(terminalName)

        await deskPM.getHomePage(deskPage).logoutFromApplication()
    });
});
