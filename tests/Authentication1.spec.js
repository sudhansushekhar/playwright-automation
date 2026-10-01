const {test, expect, request} = require('@playwright/test');
const { APIUtils } = require('../utils/APIUtils');


const baseUrl = "http://localhost:8080/"
const terminalName = "CI-CD Terminal"
let webContext;
let apiContext;


test.beforeAll(async ({browser}) =>{
   
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(baseUrl)

    // Enter Details to login
    await page.locator("input#login_email").fill("cicd")
    await page.locator("[type='password']").fill("Pass@123")
    await page.locator("button[type='submit']").first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForLoadState('load')

    await context.storageState({path : 'auth.json'});
    webContext = await browser.newContext({storageState:'auth.json'})

    const storageState = await context.storageState();

    // Add hardware_id to localhost:8080 localStorage
    const origin = storageState.origins.find(
        origin => origin.origin === "http://localhost:8080"
    );

    const addHardwareID = {
        "name": "hardware_id",
        "value": "4554c2eb-5319-4031-86f6-3f7cb085c733"
    }

    storageState.origins[0].localStorage.push(addHardwareID);

    webContext = await browser.newContext({storageState: storageState});
    
})

test('Storage State Test Case', async () => {  
    const page = await webContext.newPage();
    await page.goto(baseUrl+'app/home');
    
    await expect(page).toHaveTitle("Home");
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.locator('a').filter({ hasText: /^Retail$/ }).click();
    await expect(page).toHaveTitle("Retail");

    // click 'iVendNext POS' to open new tab
    const interfacePagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'iVendNext POS' }).click();
    const interfacePage = await interfacePagePromise;


    // POS Dashboard Landing
    await interfacePage.waitForLoadState('load')

    const defaultTransactionMode = interfacePage.getByRole('heading', { name: 'Mode: Sale' })
    await expect(defaultTransactionMode).toBeVisible();
    await expect(defaultTransactionMode).toContainText("Sale")
})