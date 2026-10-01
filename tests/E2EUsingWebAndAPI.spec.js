/**
 * Web + API E2E – Item Sale through the API, verified in the UI
 * =============================================================
 * The API prepares everything and makes the sale; the browser checks the result.
 * Faster and more stable than clicking through every step.
 *
 * Shows:
 *   - fixtures      : `page` + `pm` (browser, logged in via storageState) and
 *                     `apiUtils` (separate, logged-in API session) - see fixtures/testFixtures.js
 *   - API setup     : bind the terminal to this "device" and make sure a shift is open
 *   - API action    : submit a POS invoice
 *   - UI checks     : POS opens straight into "Sale" mode; the invoice is shown in Desk
 *
 * Flow
 *   API  bind terminal (hardware_id) + open shift
 *   UI   put hardware_id in localStorage → Desk home → Retail → POS tab in "Sale" mode
 *   API  submit POS invoice → check the response
 *   UI   Desk › POS Invoice → check customer, total, status
 *   UI   (afterEach) release the terminal for the next spec
 */
const { test, expect } = require('../fixtures/testFixtures');
const { meta } = require('reporting-labs');
const { PageManager } = require('../pageObjects/PageManager');


// Known app bug: on WebKit the POS app usually crashes while starting
// (TypeError: null is not an object (evaluating 'r.innerHTML')) and renders nothing.
// Remove this line once the app is fixed to run these tests on Safari again.
test.fixme(({ browserName }) => browserName === 'webkit', 'POS app crashes on WebKit at start-up (app bug)');


/** Request body for submit_pos_invoice, built from testData/posData.json → itemSale. */
function buildSalePayload(sale, terminalName, openingEntry){
    return {
        doc: {
            doctype: "POS Invoice",
            transaction_mode: "Sale",
            customer: sale.customerCode,
            customer_name: sale.customerName,
            pos_profile: sale.posProfile,
            company: sale.company,
            currency: sale.currency,
            conversion_rate: 1,
            set_warehouse: sale.warehouse,
            payments: [{ mode_of_payment: sale.paymentType, amount: sale.payAmount }],
            items: [{
                item_code: sale.itemCode,
                name: sale.itemName,
                qty: sale.quantity,
                transaction_mode: "Sale",
                uom: sale.uom,
            }],
            language: "en",
            custom_pos_terminal: terminalName,
            custom_pos_opening_entry: openingEntry,
        }
    }
}


test('Item Sale E2E test using API', { tag: ['@API', '@web'] }, async ({ page, pm, apiUtils, posData, terminalName }) => {
    meta({ priority: 'P0', severity: 'critical', feature: 'POS Sale', owner: 'Sudhanshu Shekhar' });
    test.slow();   // API setup + POS tab + Desk check + terminal release ≈ 30-40s

    const sale = posData.itemSale
    let posPage, openingEntry, saleResponse

    await test.step('API: bind terminal and open shift', async () => {
        const hardwareId = await apiUtils.bindTerminal(terminalName)
        openingEntry = await apiUtils.checkExistingOpeningEntry()

        // The POS recognises the "device" by hardware_id in localStorage; set it before the POS tab opens
        await page.context().addInitScript((id) => window.localStorage.setItem('hardware_id', id), hardwareId)
    })

    await test.step('UI: open POS - lands in Sale mode without terminal popup', async () => {
        await pm.getHomePage().open()
        await pm.getHomePage().clickSidebarRetailButton()
        posPage = await pm.getRetailPage().openPosInterface()

        const posPM = new PageManager(posPage)
        await posPM.getPosDashboardPage().verifyPageLoaded()
        await posPM.getPosDashboardPage().verifyTransactionMode('Sale')
    })

    await test.step('API: submit POS invoice and check the response', async () => {
        saleResponse = (await apiUtils.saleItem(posPage, buildSalePayload(sale, terminalName, openingEntry))).message

        expect(saleResponse.name).toMatch(/^ACC-PSINV-/)
        expect(saleResponse.customer).toBe(sale.customerCode)
        expect(saleResponse.customer_name).toBe(sale.customerName)
        expect(saleResponse.items[0].item_code).toBe(sale.itemCode)
        expect(saleResponse.items[0].item_name).toBe(sale.itemName)
        expect(saleResponse.items[0].qty).toBe(sale.quantity)
        expect(saleResponse.payments[0].mode_of_payment).toBe(sale.paymentType)
        expect(saleResponse.grand_total).toBe(sale.payAmount)
        expect(saleResponse.paid_amount).toBe(sale.payAmount)
    })

    await test.step('UI: invoice is shown in Desk', async () => {
        await page.bringToFront()
        await pm.getPosInvoicePage().open(saleResponse.name)
        await pm.getPosInvoicePage().verifyInvoice({
            invoiceNo: saleResponse.name,
            customerName: sale.customerName,
            customerCode: sale.customerCode,
            grandTotal: sale.payAmount,
        })
    })
});


// Free the shared terminal so the next spec can select it in the POS popup
test.afterEach(async ({ pm, terminalName }) => {
    await pm.getPosTerminalListPage().releaseTerminal(terminalName)
})
