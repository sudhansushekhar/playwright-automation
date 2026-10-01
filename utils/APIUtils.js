/**
 * APIUtils
 * --------
 * Wrapper around Playwright's APIRequestContext for the iVendNext (Frappe) backend.
 * Used to prepare data quickly through the API (login, terminal binding, opening shift,
 * POS sale) so the browser only has to check the result.
 *
 * Session note: the API context logs in on its own (loginWithAPI). Do not reuse the
 * browser's saved UI session here - it carries a CSRF token that every POST would need.
 */
const { expect } = require("@playwright/test");
const { randomUUID } = require("crypto");

const headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

class APIUtils{
    /**
     * @param {string} baseUrl                   e.g. "http://localhost:8080/"
     * @param {import('@playwright/test').APIRequestContext} apiContext
     * @param {{usr: string, pwd: string}} loginPayload
     * @param {{user: string, terminal: string}} getOpeningEntryPayload
     * @param {object} createOpeningEntryPayload  see testData/posData.json → openingEntry
     */
    constructor(baseUrl, apiContext, loginPayload, getOpeningEntryPayload, createOpeningEntryPayload){
        this.baseUrl = baseUrl;
        this.apiContext = apiContext;
        this.loginPayload = loginPayload;
        this.getOpeningEntryPayload = getOpeningEntryPayload;
        this.createOpeningEntryPayload = createOpeningEntryPayload;
        this.csrfToken = null;
    }

    // ── Authentication ────────────────────────────────────────────

    /** POST api/method/login. The session cookie stays in apiContext; its storageState is returned. */
    async loginWithAPI(){
        const loginResponse = await this.apiContext.post(this.baseUrl+"api/method/login", {headers : headers, data : this.loginPayload})
        await expect(loginResponse).toBeOK();
        console.log("API login:", (await loginResponse.json()).message);

        return await this.apiContext.storageState();
    }

    /**
     * End the API session on the server. Always call it when done: the test user may only have
     * a few sessions at once (User › simultaneous_sessions = 2), and Frappe drops the OLDEST
     * one when a new login exceeds it - which would be the saved browser session (storageState).
     */
    async logoutWithAPI(){
        await this.apiContext.post(this.baseUrl+"api/method/logout")
    }

    /** CSRF token of a logged-in browser page (Frappe exposes it as frappe.csrf_token). */
    async getCsrfTokenAfterLoggedIn(page){
        this.csrfToken = await page.evaluate(() => frappe.csrf_token);
        return this.csrfToken
    }

    // ── POS terminal ──────────────────────────────────────────────

    /** Current hardware_id of the terminal; empty when the terminal is released. */
    async getTerminal(terminalName){
        const terminalDetailsResponse = await this.apiContext.get(this.baseUrl+"api/method/frappe.desk.form.load.getdoc", {
            params: { doctype: 'POS Terminal', name: terminalName }
        })
        await expect(terminalDetailsResponse).toBeOK()

        const hardwareId = (await terminalDetailsResponse.json()).docs[0].hardware_id;
        console.log(`Terminal "${terminalName}" hardware_id: ${hardwareId || '(released)'}`)
        return hardwareId;
    }

    /**
     * Bind a released terminal to a new hardware_id (a UUID that stands in for the device).
     * Returns the hardware_id the terminal is bound to - new or existing - so the caller
     * can put it in the browser's localStorage.
     */
    async setTerminalToDB(terminalName, hardwareId){
        if (!hardwareId){
            hardwareId = randomUUID()
            console.log(`Binding terminal "${terminalName}" to new hardware_id: ${hardwareId}`);

            const setTerminalResult = await this.apiContext.post(this.baseUrl + "api/method/frappe.client.set_value", {
                data: { doctype: "POS Terminal", name: terminalName, fieldname: "hardware_id", value: hardwareId }
            });
            await expect(setTerminalResult).toBeOK();
        }
        return hardwareId;
    }

    /** getTerminal + setTerminalToDB in one call. */
    async bindTerminal(terminalName){
        const hardwareId = await this.getTerminal(terminalName)
        return await this.setTerminalToDB(terminalName, hardwareId)
    }

    // ── Opening shift ─────────────────────────────────────────────

    /** Name of the open shift (POS Opening Entry) for the user/terminal, or null. */
    async getOpeningEntry(){
        const getOpeningEntryResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.point_of_sale.get_opening_entry", {headers : headers, data : this.getOpeningEntryPayload})
        await expect(getOpeningEntryResponse).toBeOK();

        const getOpeningEntryJson = await getOpeningEntryResponse.json();
        const openingEntry = getOpeningEntryJson.message.active_opening?.name ?? null;
        console.log('Open shift:', openingEntry ?? '(none)');
        return openingEntry;
    }

    /** Open a new shift and return its name. */
    async createOpeningEntry(){
        const createOpeningEntryResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.point_of_sale.create_pos_opening_entry", {headers : headers, data : this.createOpeningEntryPayload})
        await expect(createOpeningEntryResponse).toBeOK();

        const openingEntry = (await createOpeningEntryResponse.json()).message.name;
        console.log('Created shift:', openingEntry);
        return openingEntry;
    }

    /** Reuse the open shift, or create one. */
    async checkExistingOpeningEntry(){
        return (await this.getOpeningEntry()) ?? (await this.createOpeningEntry())
    }

    // ── Sale ──────────────────────────────────────────────────────

    /** Submit a POS invoice. `page` is a logged-in browser page used only to read the CSRF token. */
    async saleItem(page, salePayload){
        const csrfToken = await this.getCsrfTokenAfterLoggedIn(page);
        const saleResponse = await this.apiContext.post(this.baseUrl+"api/method/ivendnext_pos.api.pos_invoice.submit_pos_invoice", {
            headers: {"x-frappe-csrf-token" : csrfToken},
            data: salePayload
        })
        await expect(saleResponse).toBeOK();

        const saleResponseJson = await saleResponse.json()
        console.log(`POS invoice created: ${saleResponseJson.message.name}`)
        return saleResponseJson
    }
}

module.exports = {APIUtils}
