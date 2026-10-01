const {test, expect} = require('@playwright/test')

test('Browser Context Playwright Test', async ({browser}) => {    // Here browser is a fixture inside {} as {browser}
    // Playwright Code now
    const context = await browser.newContext();
    const page = await context.newPage();

    page.goto("https://google.com/")
});

test('Page Playwright Test', async ({page}) => {    // Here page is palywright page context, no need to define browser context separately, playwright does it internally
    // Playwright Code now

    await page.goto("http://localhost:8080/")
    await expect(page).toHaveTitle("Login")

    // Enter Details to login
    await page.locator("input#login_email").fill("cicd")
    await page.locator("[type='password']").fill("Pass@123")
    await page.locator("button[type='submit']").first().click()

    await expect(page).toHaveTitle("Home")
    console.log(await page.locator("div h3[class*='title-text']").textContent())

    await page.locator("#side-menu div[class*='menu-icons-with-label'] ul li[data-module='Retail']").click()
    await expect(page).toHaveTitle("Retail")
    console.log(await page.locator("div h3[class*='title-text']").textContent())

    await expect(await page.locator("#editorjs [aria-label='iVendNext POS']")).toContainText("iVendNext POS")

    // List of all elements and click/get desired one
    const cards = page.locator("[card_name='Settings'] .widget-body a")

    // Strict mode if want to perform an action from list of elements, it doesnt know on which to perform
    console.log(await cards.first().textContent())  // first element
    console.log(await cards.nth(3).textContent())   // nth element starting from 0 index
    console.log(await cards.last().textContent())   // last element

    // to print all elements text at once without strict mode violation
    const cardsText = await cards.allTextContents()
    console.log(cardsText)
    

});

test.only('Window Handles Test', async ({browser}) => {    
    // Playwright Code now

    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = "http://localhost:8080/"
    await page.goto(baseUrl);
    await expect(page).toHaveTitle("Login");

    // Enter Details to login
    await page.locator("input#login_email").fill("cicd");
    await page.locator("[type='password']").fill("Pass@123");
    await page.locator("button[type='submit']").first().click();

    await expect(page).toHaveTitle("Home");
    console.log(await page.locator("div h3[class*='title-text']").textContent());

    await page.locator("#side-menu div[class*='menu-icons-with-label'] ul li[data-module='Retail']").click();
    await expect(page).toHaveTitle("Retail");
    
    // click 'iVendNext POS' to open new tab
    const [interfacePage] = await Promise.all(
        [
            context.waitForEvent('page'),    // Listen for any new page to be opened
            page.locator("#editorjs [aria-label='iVendNext POS']").click() // new page opened
        ]);

    const posTerminalWindow = interfacePage.locator("#pos_terminal_window")

    if(!await interfacePage.locator("#pos_terminal_window").isVisible()){
        interfacePage.reload()

        await expect(interfacePage.locator("#pos_terminal_window")).toBeVisible()

    } 

    const popupHeading = interfacePage.locator("#pos_terminal_windowHeader");

    await expect(posTerminalWindow).toBeVisible()
    await expect(popupHeading).toContainText("Select POS Terminal");

    // Select Terminal
    const terminalName = "ManualTest1";
    const terminalInDropdown = interfacePage.locator(`smart-list-item[label='${terminalName}']`)
    await interfacePage.locator("smart-drop-down-list#pos_terminal_name").click()
    await terminalInDropdown.isVisible()
    await terminalInDropdown.click()

    await expect(interfacePage.locator("#pos_terminal_nameActionButton span")).toHaveText(terminalName)

    await interfacePage.locator("#pos_terminal_submit button").click()

    
    // POS Opening Entery Popup
    const openingAmountWindow = interfacePage.locator("smart-window#open_shift_window")
    
    if(await openingAmountWindow.isVisible()){
        const openingAmountHeading = interfacePage.locator("#open_shift_windowHeader");
        const openingAmountInputReadOnly = interfacePage.locator("smart-number-input#open_shift_opening_amount input");
        const openingAmountTerminalInputReadOnly = interfacePage.locator("smart-input[name='pos_terminal'] input")
        const openingAmountSubmitButton = interfacePage.locator("#open_shift_submit button");

        await expect(openingAmountHeading).toContainText("Opening Amount");

        const denominationColumnName = "10";
        const denominationCountValue = "2";
        const calculatedAmount = parseInt(denominationColumnName) * parseInt(denominationCountValue)
    
        const targetTenderRow = interfacePage.locator(`smart-grid-row:nth-child(2)`)
        const targetTenderColumnCount = targetTenderRow.locator(`div[data-field='count']`)
        const targetTenderColumnInput = targetTenderColumnCount.locator(`input` )
        const targetTenderColumnAmount = targetTenderRow.locator(`div[data-field='amount']`)


        await expect(await openingAmountTerminalInputReadOnly).toHaveText(terminalName)

        await targetTenderColumnCount.click()       // Activates input field
        await targetTenderColumnInput.fill(denominationCountValue)
        await interfacePage.keyboard.press('Tab');
        
        await expect(await targetTenderColumnAmount).toHaveText(calculatedAmount)   // Amount Cell Value

        await expect(await openingAmountInputReadOnly).toHaveText(calculatedAmount)   // OPening Amount Header Value

        await openingAmountSubmitButton.click()

        await expect(openingAmountWindow.toBeHidden());
        // expect(await openingAmountWindow.toBeVisible()).toBeFalsy();
    
    }

    // POS Dashboard Landing
    const defaultTransactionMode = interfacePage.locator("[data-name*='transaction_mode'] span:nth-child(2)")
    await expect(defaultTransactionMode).toHaveText("Sale")


    // Swith back to previous page
    await page.bringToFront()
    await page.locator("#side-menu div[class*='menu-icons-with-label'] ul li[data-module='Home']").click()
    await page.waitForLoadState('domcontentloaded')

    await page.locator("#side-menu div[class*='menu-icons-with-label'] ul li[data-module='Retail']").click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveTitle("Retail")
    console.log(await page.locator("div h3[class*='title-text']").textContent())

    await expect(await page.locator("#editorjs [aria-label='iVendNext POS']")).toContainText("iVendNext POS")

    // List of all elements and click/get desired one
    const cards = page.locator("[card_name='Settings'] .widget-body a")

    // Strict mode if want to perform an action from list of elements, it doesnt know on which to perform
    console.log(await cards.first().textContent())  // first element
    console.log(await cards.nth(3).textContent())   // nth element starting from 0 index
    console.log(await cards.last().textContent())   // last element

    // to print all elements text at once without strict mode violation
    const cardsText = await cards.allTextContents()
    console.log(cardsText)

});


