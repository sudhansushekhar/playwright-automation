const { expect , request} = require("@playwright/test");
const { randomUUID } = require("crypto");

const headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

class APIUtils{
    constructor(baseUrl, apiContext, loginPayload, getOpeningEntryPayload, createOpeningEntryPayload){
        this.baseUrl = baseUrl;
        this.apiContext = apiContext;
        this.loginPayload = loginPayload;
        this.getOpeningEntryPayload = getOpeningEntryPayload;
        this.createOpeningEntryPayload = createOpeningEntryPayload;
        this.csrfToken = null;
    }

    async loginWithAPI(){
        const loginResponse = await this.apiContext.post(this.baseUrl+"api/method/login", {headers : headers, data : this.loginPayload})
        
        await expect(loginResponse).toBeOK();
        console.log("Headers:", loginResponse.headers());

        const responseText = await loginResponse.text();
        console.log("Login response:", responseText);

        // Get cookies maintained by apiContext
        const cookies = await this.apiContext.storageState();
        return cookies;
    }

    async getOpeningEntry(){
        const getOpeningEntryResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.point_of_sale.get_opening_entry", {headers : headers, data : this.getOpeningEntryPayload})
        await expect(getOpeningEntryResponse).toBeOK();
    
        const getOpeningEntryJson = await getOpeningEntryResponse.json();    
        console.log('Opening Entry:', getOpeningEntryJson.message.active_opening.name);

        return getOpeningEntryJson.message.active_opening.name;
    }

    async createOpeningEntry(){
        
        const createOpeningEntryResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.point_of_sale.create_pos_opening_entry", {headers : headers, data : this.createOpeningEntryPayload})
        console.log('Create status:', createOpeningEntryResponse.status());
        console.log('Create response:', await createOpeningEntryResponse.text());
        await expect(createOpeningEntryResponse).toBeOK();

        const createOpeningEntryJson = await createOpeningEntryResponse.json();

        return createOpeningEntryJson.message.name;
        
    }

    async checkExistingOpeningEntry(){
        let openingEntry = await this.getOpeningEntry()
        if(openingEntry == null){
            openingEntry = await this.createOpeningEntry()
        } else openingEntry;

        return openingEntry
    }

    async getTerminal(getTerminalEndPoint, terminalName){
        const getTerminalParams = { doctype: 'POS Terminal', name: terminalName }
        const terminalDetailsResponse = await this.apiContext.get(getTerminalEndPoint, {params:getTerminalParams})
        await expect(terminalDetailsResponse).toBeOK()

        const terminalDetailsJson = await terminalDetailsResponse.json()
        console.log("Terminal Details : ", terminalDetailsJson)
        const terminal = terminalDetailsJson.docs[0];

        let hardwareId = terminal.hardware_id;
        console.log(`Terminal Hardware ID: ${hardwareId}`)
        
        return hardwareId;
    }

    async setTerminalToDB( terminalName, hardwareId){
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
            const setTerminalResult = await this.apiContext.post(this.baseUrl + "api/method/frappe.client.set_value", {data:terminalSetupPayload});
            const result = await setTerminalResult.json()
            console.log("Set Hardware ID response:", result);
            return hardwareId;
        }
    }

    async getCsrfTokenAfterLoggedIn(page){
        this.csrfToken = await page.evaluate(() => frappe.csrf_token);
        console.log(`CSRF TOKEN : ${this.csrfToken}`)

        return this.csrfToken
    }

    async saleItem(page, salePayload){
        const csrfToken = await this.getCsrfTokenAfterLoggedIn(page);
        const saleResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.pos_invoice.submit_pos_invoice", {headers:{"x-frappe-csrf-token" : csrfToken}, data: salePayload})
        console.log("Sale status:", saleResponse.status());
        console.log("Sale response:", await saleResponse.text());
    
        await expect(saleResponse).toBeOK();
        return saleResponse.json()
    }
}

module.exports = {APIUtils}