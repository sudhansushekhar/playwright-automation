/**
 * Web E2E – Gift Card Sales (UI only, Page Object Model + PageManager)
 * ===================================================================
 * Sells a gift card in the POS tab and checks it in Desk (back office) - all through the UI.
 *
 * Shows:
 *   - storageState  : the browser context starts logged in (session saved by auth.setup.js)
 *   - PageManager   : one manager per tab (deskPM for Desk, posPM for the POS popup tab)
 *   - serial mode   : TC-02 uses the invoice number captured in TC-01
 *   - hooks         : beforeAll opens the POS once, afterEach voids a half-done sale on
 *                     failure, afterAll releases the shared terminal
 *
 * Flow
 *   beforeAll  release terminal → Desk home → Retail → open POS tab → select terminal
 *              → opening amount (only for a new shift) → POS in "Sale" mode
 *   TC-01      gift card → cart → quick cash → capture invoice no.
 *   TC-02      Desk › Gift Card list → filter by POS Invoice → open card → check balance
 */
const { test, expect } = require('../fixtures/testFixtures')
const { meta } = require('reporting-labs')
const { PageManager } = require('../pageObjects/PageManager')
const { ENV } = require('../config/env')
const { getTerminalForWorker } = require('../utils/TerminalPool')
const posData = require('../testData/posData.json')

// ── State shared by the serial tests ──────────────────────────────
let context;        // one browser context for the whole suite
let deskPage;       // Desk tab (back office)
let posPage;        // POS tab, opened from Desk
let deskPM;         // PageManager for deskPage
let posPM;          // PageManager for posPage
let transactionNo;  // POS invoice created in TC-01, checked in TC-02
let terminalName;   // this worker's POS terminal (utils/TerminalPool.js)


test.describe.serial('Gift Card Sales', { tag: '@web' }, () => {

    // Known app bug: on WebKit the POS app usually crashes while starting
    // (TypeError: null is not an object (evaluating 'r.innerHTML')) and renders nothing.
    // Remove this line once the app is fixed to run these tests on Safari again.
    test.fixme(({ browserName }) => browserName === 'webkit', 'POS app crashes on WebKit at start-up (app bug)');

    // ── Setup: runs once before TC-01 ─────────────────────────────
    test.beforeAll(async ({ browser }, testInfo) => {
        terminalName = getTerminalForWorker(testInfo)

        // Release + POS tab + terminal/opening-shift popups take ~35s; hooks share the 30s test timeout
        test.setTimeout(90 * 1000);

        // Own context (not the `page` fixture) so both tabs stay open across the serial tests.
        // storageState = the session saved by auth.setup.js → no UI login needed here.
        context = await browser.newContext({ storageState: ENV.authFile });
        deskPage = await context.newPage();
        deskPM = new PageManager(deskPage);

        // Free the shared terminal so the POS dropdown offers it
        await deskPM.getPosTerminalListPage().releaseTerminal(terminalName)

        // Desk home → Retail → POS (opens in a new tab)
        await deskPM.getHomePage().open();
        await deskPM.getHomePage().clickSidebarRetailButton();
        posPage = await deskPM.getRetailPage().openPosInterface();
        posPM = new PageManager(posPage);

        // POS start-up popups
        await posPM.getPosTerminalPopup().verifyPageLoaded();
        await posPM.getPosTerminalPopup().selectPosTerminal(terminalName);
        await posPM.getOpeningAmountPopup().fillOpeningAmount(terminalName, posData.openingAmount.denomination, posData.openingAmount.count);

        await posPM.getPosDashboardPage().verifyPageLoaded();
        await posPM.getPosDashboardPage().verifyTransactionMode('Sale')
    });


    // ── Tests ─────────────────────────────────────────────────────
    test('TC-01 Gift Card Sale E2E test', async () => {
        meta({ priority: 'P0', severity: 'critical', feature: 'Gift Card', owner: 'Sudhanshu Shekhar' });
        const giftCardItemCode = posData.giftCard.itemCode

        await test.step('Add gift card to the cart', async () => {
            await posPM.getPosDashboardMenu().clickGiftCardButton()
            await posPM.getGiftCardSearchPage().verifyPageLoaded()
            await posPM.getGiftCardSearchPage().searchAndAddGiftCard(giftCardItemCode)
            await posPM.getPosDashboardPage().verifyItemAddedToTransaction(giftCardItemCode)
        })

        await test.step('Pay with quick cash and capture the invoice no.', async () => {
            await posPM.getPosDashboardPage().quickPayment()
            transactionNo = await posPM.getPaymentDetailsPage().captureTransactionNo()
            expect(transactionNo).toMatch(/^ACC-PSINV-/)
        })

        await test.step('Start a new transaction', async () => {
            await posPM.getPaymentDetailsPage().clickNewTransaction()
        })
    });

    test('TC-02 Verify Gift Card Details', async () => {
        meta({ priority: 'P1', severity: 'major', feature: 'Gift Card', owner: 'Sudhanshu Shekhar' });
        const giftCardList = deskPM.getGiftCardListPage()

        await deskPage.bringToFront()

        await test.step('Filter Gift Card list by the POS invoice from TC-01', async () => {
            await giftCardList.open()
            await giftCardList.clearAllFilters()
            await giftCardList.addFilter()
            await giftCardList.fillFilterDetails(posData.giftCard.filterField, posData.giftCard.filterCondition, transactionNo);
            await giftCardList.applyFilters()
        })

        await test.step('Open the gift card and check its balance', async () => {
            await giftCardList.clickFilteredSerialNo()
            const balance = await giftCardList.getGiftCardBalanceValue()
            expect(Number(balance.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0)
        })

        await posPage.bringToFront()
    });


    // ── Recovery: void a half-finished sale so the next test starts clean ──
    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== 'failed') return

        console.error(`❌ "${testInfo.title}" failed - voiding the open transaction`);
        try {
            await posPage.bringToFront()
            await posPage.reload();
            await posPage.waitForLoadState('networkidle')

            await posPM.getPosDashboardMenu().clickVoidTransactionButton()
            await posPM.getPosDashboardPage().clickConfirmPopupYesButton()
            console.log("✅ Transaction voided");
        } catch (recoveryError) {
            console.error("🚨 Recovery failed - the POS may still hold an open transaction", recoveryError);
        }
    });


    // ── Teardown ──────────────────────────────────────────────────
    // No logout here: it would end the shared session and break the saved storageState
    test.afterAll(async () => {
        if (!deskPage) return
        await deskPage.bringToFront()
        await deskPM.getPosTerminalListPage().releaseTerminal(terminalName)
        await context.close()
    });
});
