const {test, expect, request} = require('@playwright/test');
const { randomUUID } = require('crypto');

const headers= {'Accept': 'application/json', 'Content-Type': 'application/json'}
const body= JSON.stringify({usr: 'cicd', pwd: 'Pass@123'})
const baseUrl = "http://localhost:8080/"  
const getOpeningEnteryUrl = baseUrl+"api/method/ivendnext_pos.api.point_of_sale.get_opening_entry"
const createOpeningEnteryUrl = baseUrl+"api/method/ivendnext_pos.api.point_of_sale.create_pos_opening_entry"
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
let openingEntry;
let apiContext;
let sid;
let headersWithSid;
let cookies;

test.beforeAll( async () => {
    const loginUrl = baseUrl+"api/method/login";

    apiContext = await request.newContext();
    const loginResponse = await apiContext.post(loginUrl, {headers : headers, data : body})
    
    console.log("Status:", loginResponse.status());
    console.log("Headers:", loginResponse.headers());

    const responseText = await loginResponse.text();
    console.log("Response body:", responseText);

    // const cookieString = loginResponse.headers()["set-cookie"];
    // sid = cookieString.split(';')[0].split('=')[1]
    // console.log(`SID : ${sid}`)

    cookies = await apiContext.storageState();

    console.log("Cookies :", cookies.cookies);
    

    headersWithSid = {...headers, 'Cookie' : `sid=${sid}`};
    const getOpeningEntryResponse = await apiContext.post(getOpeningEnteryUrl, {headers : headers, data : getOpeningEntryPayload})
    await expect(getOpeningEntryResponse).toBeOK();

    const getOpeningEntryJson = await getOpeningEntryResponse.json();

    console.log('Opening Entry Response:', getOpeningEntryJson);


    if(getOpeningEntryJson.message.active_opening == null){
        const createOpeningEntryResponse = await apiContext.post(createOpeningEnteryUrl, {headers : headers, data : createOpeningEntryPayload})
        console.log('Create status:', createOpeningEntryResponse.status());
        console.log('Create response:', await createOpeningEntryResponse.text());
        await expect(createOpeningEntryResponse).toBeOK();

        const createOpeningEntryJson = await createOpeningEntryResponse.json();

        openingEntry = createOpeningEntryJson.message.name;
    } else openingEntry = getOpeningEntryJson.message.active_opening.name;
    console.log('Opening Entry:', openingEntry);
    

})
test.only('Item Sale E2E test using API', async ({page}) => { 
    // API Injection
    // page.addInitScript(value => {
    //     window.localStorage.setItem('token', value), token
    // })

    // await page.context().addCookies([{name: 'sid', value: sid, url: baseUrl}]);
    await page.context().addCookies(cookies.cookies);

    await page.goto(baseUrl+'app/home');

    await expect(page).toHaveTitle("Home");
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.locator('a').filter({ hasText: /^Retail$/ }).click();
    await expect(page).toHaveTitle("Retail");

    // Fetch terminal details if assigned
    const getTerminalParams = { doctype: 'POS Terminal', name: terminalName }
    const terminalDetailsResponse = await apiContext.get(baseUrl+"api/method/frappe.desk.form.load.getdoc", {headers:headers, params:getTerminalParams})
    await expect(terminalDetailsResponse).toBeOK()

    const terminalDetailsJson = await terminalDetailsResponse.json()
    const terminal = terminalDetailsJson.docs[0];

    let hardwareId = terminal.hardware_id;
    console.log(`Terminal Hardware ID: ${hardwareId}`)
    if (!hardwareId){
        
        // Released → assign new UUID
        hardwareId = randomUUID()
        console.log(`Terminal already released. Assigning new Hardware ID: ${hardwareId}`);

        // Select terminal with UUID format using API before opening Terminal Popup
        const terminalSetupPayload = {
            "doctype": "POS Terminal",
            "name": terminalName,
            "fieldname": "hardware_id",
            "value": hardwareId
        };

        // Use browser's authenticated Frappe session
        const setTerminalResult = await page.evaluate(
            async (payload) => {

                const response = await frappe.call({
                    method: "frappe.client.set_value",
                    args: payload
                });

                return response.message;
            },
            terminalSetupPayload
        );

        console.log("Set Hardware ID response:", setTerminalResult);

    }

    await page.context().addInitScript((hardwareId) =>{
        window.localStorage.setItem('hardware_id', hardwareId)
    }, hardwareId);

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


    // Sell Gift Card using API
    const giftCardSalePayload = {
    "doc": {
        "customer": "C00016",
        "customer_name": "George Thompson",
        "pos_profile": "POS-NY",
        "company": "ACME Retail",
        "currency": "USD",
        "conversion_rate": 1,
        "set_warehouse": "New York Store - AR",
        "transaction_mode": "Sale",
        "doctype": "POS Invoice",
        "payments": [
        {
            "mode_of_payment": "Cash",
            "amount": 9.89
        }
        ],
        "items": [
        {
            "item_code": "AF-001",
            "name": "Spider man Figure",
            "qty": 1,
            "transaction_mode": "Sale",
            "uom": "Each"
        }
        ],
        "taxes": [
        {
            "__islocal": 1,
            "charge_type": "On Net Total",
            "account_head": "NY State Tax - AR",
            "description": "NY State Tax"
        }
        ],
        "language": "en",
        "custom_pos_terminal": terminalName,
        "custom_pos_opening_entry": openingEntry
    }
    }
    const csrfToken = await page.evaluate(() => frappe.csrf_token);
    console.log(`CSRF TOKEN : ${csrfToken}`)
    const saleResponse = await apiContext.post(baseUrl+"api/method/ivendnext_pos.api.pos_invoice.submit_pos_invoice", {headers:{...headers, "x-frappe-csrf-token" : csrfToken}, data: giftCardSalePayload})
    console.log("Sale status:", saleResponse.status());
    console.log("Sale response:", await saleResponse.text());

    await expect(saleResponse).toBeOK();
    const saleResponseJson = saleResponse.json()

    const posInvoiveNO = saleResponseJson.message.name
    const customerName = saleResponseJson.message.customer_name
    const saleInvoice = saleResponseJson.message.consolidated_invoice
    const subTotal = saleResponseJson.message.base_net_total
    const totalTaxesAndCharges = saleResponseJson.message.total_taxes_and_charges
    const grandTotal = saleResponseJson.message.grand_total
    const paidAmount = saleResponseJson.message.paid_amount
    const paymentMode = saleResponseJson.message.payments[0].mode_of_payment

});
