const {test, expect, request} = require('@playwright/test');
const { APIUtils } = require('../utils/APIUtils');

const headers= {'Accept': 'application/json', 'Content-Type': 'application/json'}
const loginPayload = {'usr': 'cicd@citixsys.com', 'pwd': 'Pass@123'}
const baseUrl = "http://localhost:8080/"  
const openingEntryUser = "cicd@citixsys.com"
const terminalName = "CI-CD Terminal"
const getOpeningEntryPayload = {"user" : openingEntryUser, "terminal" : terminalName}
const createOpeningEntryPayload = {
    "company_name" : "ACME Retail",
    "pos_profile_name" :"POS-NY",
    "pos_terminal_name" : terminalName,
    "team_name" : "",
    "opening_amount" : 0,
    "cash_drawer" : "Cash Drawer 1",
    "default_mode_of_payment" : "Cash",
    "denomination_detail" : "[{\"code\":1,\"count\":0,\"denomination_value\":0}]"
}
let apiUtils;
let openingEntry;
let context;
let apiContext;
let page;

test.beforeAll( async ({browser }) => {
    // 1. API context
    apiContext = await request.newContext();

    apiUtils = new APIUtils(baseUrl, apiContext, loginPayload, getOpeningEntryPayload, createOpeningEntryPayload)

    // 2. Login through API
    const storageState  = await apiUtils.loginWithAPI(baseUrl)

    // 3. Create browser context using API login
    context = await browser.newContext({storageState});

    // 4. Create page from that authenticated context
    page = await context.newPage();

    // 5. Fetch terminal details through authenticated API context
    let hardwareId = await apiUtils.getTerminal(baseUrl+"api/method/frappe.desk.form.load.getdoc", terminalName)
    
    await apiUtils.setTerminalToDB(terminalName, hardwareId)
    
    // 6. Set localStorage on browser context
    await context.addInitScript((hardwareId) => {
        window.localStorage.setItem('hardware_id', hardwareId);
    }, hardwareId);
    
    // Now API calls use API session
    openingEntry = await apiUtils.checkExistingOpeningEntry()


})

test.only('Item Sale E2E test using API', async () => { 
    
    await page.goto(baseUrl+'app/home');

    await expect(page).toHaveTitle("Home");
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.locator('a').filter({ hasText: /^Retail$/ }).click();
    await expect(page).toHaveTitle("Retail");

    
    // click 'iVendNext POS' to open new tab
    const interfacePagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'iVendNext POS' }).click();
    const interfacePage = await interfacePagePromise;


    // Just log/verify
    const browserHardwareId = await interfacePage.evaluate(() => {
        return window.localStorage.getItem("hardware_id");
    });

    console.log("Using Browser hardware_id:", browserHardwareId);

    // POS Dashboard Landing
    await interfacePage.waitForLoadState('load')

    const defaultTransactionMode = interfacePage.getByRole('heading', { name: 'Mode: Sale' })
    await expect(defaultTransactionMode).toBeVisible();
    await expect(defaultTransactionMode).toContainText("Sale")


    // Sell Item using API
    const customerCode = "C00016";
    const customerName = "George Thompson";
    const itemCode = "AF-001";
    const itemName = "Spider man Figure";
    const quantity = 1;
    const paymentType = "Cash";
    const payAmount = 9.89;

    const salePayload = {
        "doc": {
            "customer": customerCode,
            "customer_name": customerName,
            "pos_profile": "POS-NY",
            "company": "ACME Retail",
            "currency": "USD",
            "conversion_rate": 1,
            "set_warehouse": "New York Store - AR",
            "transaction_mode": "Sale",
            "doctype": "POS Invoice",
            "payments": [
            {
                "mode_of_payment": paymentType,
                "amount": payAmount
            }
            ],
            "items": [
            {
                "item_code": itemCode,
                "name": itemName,
                "qty": quantity,
                "transaction_mode": "Sale",
                "uom": "Each"
            }
            ],
            "language": "en",
            "custom_pos_terminal": terminalName,
            "custom_pos_opening_entry": openingEntry
        }
    }

    const saleResponseJson = await apiUtils.saleItem(interfacePage, salePayload)

    const posInvoiceNo = saleResponseJson.message.name
    const customer_Name = saleResponseJson.message.customer_name
    const customer_Code = saleResponseJson.message.customer
    const item_Name = saleResponseJson.message.items[0].item_name
    const item_Code = saleResponseJson.message.items[0].item_code
    const item_qty = saleResponseJson.message.items[0].qty
    const saleInvoice = saleResponseJson.message.consolidated_invoice
    const grandTotal = saleResponseJson.message.grand_total
    const paidAmount = saleResponseJson.message.paid_amount
    const paymentMode = saleResponseJson.message.payments[0].mode_of_payment

    console.log(`POS Invoice : ${posInvoiceNo}`)
     console.log(`Sale Invoice : ${saleInvoice}`)
    expect(paymentMode).toBe('Cash')
    expect(customer_Name).toBe(customerName)
    expect(customer_Code).toBe(customerCode)
    expect(item_Name).toBe(itemName)
    expect(item_Code).toBe(itemCode)
    expect(item_qty).toBe(quantity)
    expect(grandTotal).toBe(payAmount)
    expect(paidAmount).toBe(payAmount)

});
