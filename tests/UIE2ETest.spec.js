const {test, expect} = require('@playwright/test')

test.only('Gift Card Sale E2E test', async ({browser}) => {    
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

    // POS TERMINAL SELECTION
    const posTerminalWindow = interfacePage.locator("#pos_terminal_window")
    const isWindowVisible = await posTerminalWindow.isVisible();
    

    if(!isWindowVisible){
        console.log("⚠️ POS Terminal window is hidden or not rendered. Refreshing page...");

        await interfacePage.reload()
        await interfacePage.waitForLoadState('load');

        await expect(posTerminalWindow).toBeVisible()

    } else {
        console.log("✅ POS Terminal window detected successfully.");
    }

    const popupHeading = interfacePage.locator("#pos_terminal_windowHeader");
    const submitButton = interfacePage.locator("ivend-button[id='pos_terminal_submit'] button")

    await expect(posTerminalWindow).toBeVisible()
    await expect(popupHeading).toContainText("Select POS Terminal");

    // Select Terminal
    const terminalName = "CI-CD Terminal";
    const terminalInDropdown = interfacePage.locator(`smart-list-item[label='${terminalName}']`)
    await interfacePage.locator("smart-drop-down-list#pos_terminal_name").click()
    await terminalInDropdown.waitFor({state : 'visible'})
    await terminalInDropdown.click()

    const selectedTextSpan = interfacePage.locator("#pos_terminal_nameActionButton span");
    await expect(selectedTextSpan).toHaveText(terminalName);

    await interfacePage.waitForLoadState('networkidle');

    await interfacePage.waitForTimeout(500);
    
    await submitButton.click()
    await interfacePage.waitForLoadState('networkidle')
    
    await submitButton.waitFor({ state: 'hidden', timeout: 5000 });
    await interfacePage.waitForTimeout(1000);

    
    // POS Opening Entery Popup
    const openingAmountWindow = interfacePage.locator("smart-window #open_shift_windowHeader")

    if(await openingAmountWindow.isVisible()){
        console.log("👉 Opening Shift Window detected. Processing shift amounts...");
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

        const selectedTerminal = await openingAmountTerminalInputReadOnly.inputValue()
        expect(selectedTerminal).toBe(terminalName)


        await targetTenderColumnCount.click()       // Activates input field
        await targetTenderColumnInput.fill(denominationCountValue)
        await interfacePage.keyboard.press('Tab');
        
        await expect(targetTenderColumnAmount).toHaveText(calculatedAmount.toString())   // Amount Cell Value

        let openingAmount = await openingAmountInputReadOnly.inputValue()   // OPening Amount Header Value
        expect(openingAmount).toBe(calculatedAmount.toString())

        await openingAmountSubmitButton.click()

        await expect(openingAmountWindow.toBeHidden());
        // expect(await openingAmountWindow.toBeVisible()).toBeFalsy();
    
    } else {
        console.log("ℹ️ Opening Shift Window did not appear. Moving straight to POS Dashboard.");
    }

    // POS Dashboard Landing
    const defaultTransactionMode = interfacePage.locator("[data-name*='transaction_mode'] span:nth-child(2)")
    await expect(defaultTransactionMode).toHaveText("Sale")

    // GIFT CARD SALE
    // Add Gift Card to transaction
    const transactionButton = interfacePage.locator("ivend-dynamic-button[data_parameter_1*='Transaction Button Panel'] button")
    const giftCardButton = interfacePage.locator("ivend-dynamic-button[data_parameter_1*='gift_card_sale'] button")

    await transactionButton.click()
    await giftCardButton.click()

    const giftCardSearchPage = interfacePage.locator("#gift_card_sale_html h5")
    const giftCardSearchPageSearchInput = interfacePage.locator("#gift_card_sale_search_as_you_type input")
    const giftCardSearchPageItemLine = interfacePage.locator("smart-grid-cell[data-field='tabItem.item_code'] div")
    const giftCardSearchPageSelectedItem = interfacePage.locator("smart-grid-cell[data-field='tabItem.item_code'][aria-selected='true'] div")
    const giftCardSearchPageOkButton = interfacePage.locator("ivend-button#gift_card_sale_ok button")

    await expect(giftCardSearchPage).toBeVisible()
    await expect(giftCardSearchPage).toHaveText("Gift Card Sale")

    const giftCardItemCode = "GC-Gold-2025"
    await giftCardSearchPageSearchInput.fill(giftCardItemCode)
    await interfacePage.waitForLoadState('domcontentloaded')
    await interfacePage.waitForLoadState('load')

    await giftCardSearchPageItemLine.getByText(giftCardItemCode).click();
    await interfacePage.waitForLoadState('domcontentloaded')

    await expect(giftCardSearchPageSelectedItem).toBeVisible()

    await giftCardSearchPageOkButton.click()
    await interfacePage.waitForLoadState('networkidle')
    await interfacePage.waitForLoadState('domcontentloaded')

    // Gift card Added to POS as line Item
    const transactionGridSelectedRow = interfacePage.locator("smart-grid-row[aria-selected='true']")
    const transactionGridSelectedItem = transactionGridSelectedRow.locator(`[data-field='item_code'][title='${giftCardItemCode}']`)

    await expect(transactionGridSelectedItem).toBeVisible()

    // Do Quick Cash
    const paymentInterfaceBlock = interfacePage.locator("smart-button[data_parameter_1*='Payment Interface]")
    const quickCashButton = interfacePage.locator("smart-button[class*='quick_cash'] button")
    const quickCashPopup = interfacePage.locator("#formWindow")
    const quickCashYesButton = quickCashPopup.locator("ivend-button[id='yes'] button")

    const transactionCompletePanel = interfacePage.locator("div[id*='transaction_complete']")
    const newTransaction = transactionCompletePanel.locator("[class*='new_invoice'] button")


    await quickCashButton.click()
    await expect(quickCashPopup).toBeVisible()
    await quickCashYesButton.click()
    await interfacePage.waitForLoadState('networkidle')

    // Get Transaction No
    const transactionReceipt = interfacePage.locator("[data-name*='transaction_receipt']")
    const transactionNoSection = interfacePage.locator("[id='page-pos-interface'] table tbody tr:nth-child(5) td")
    const transactionSectionText = await transactionNoSection.textContent()
    console.log(`Captured Transaction Contents: ${transactionSectionText}`)

    const transactionNo = transactionSectionText.split(':')[1].split('\n')[0].trim()
    console.log(`Transaction No: ${transactionNo}`)

    await expect(transactionCompletePanel).toBeVisible()
    await newTransaction.click()
    await interfacePage.waitForLoadState('networkidle')

    await expect(defaultTransactionMode).toHaveText("Sale")

    // Swith back to previous page
    await page.bringToFront()
    await page.locator("#side-menu div[class*='menu-icons-with-label'] ul li[data-module='Home']").click()
    await page.waitForLoadState('domcontentloaded')


    // Gift Card List Page
    console.log(`URL: ${baseUrl}app/gift-card`)
    await page.goto(`${baseUrl}app/gift-card`)

    const giftCardPage = page.locator("[id='page-List/Gift Card/List']")
    const giftCardPageTitle = giftCardPage.locator("h3")
    const clearFilterXButton = giftCardPage.locator("[title='Clear all filters']")
    const filterButton = giftCardPage.locator("[class*='filter-button']")
    const applyFiltersButton = page.locator(".filter-action-buttons button[class*='apply-filters']")

    //filter Popup
    const filterField = page.locator("div[class*='list_filter']").last()
    const filterFieldInput = filterField.locator("input[role='combobox']").first()
    const filterFieldOption = filterField.locator("ul[role='listbox']:not([hidden])")
    const filterCondition = filterField.locator("select[class*='condition']")

    const fieldName="POS Invoice"
    const fieldValue = fieldName.toLowerCase().replace(" ", "_");

    await expect(page).toHaveTitle("Gift Card")
    await expect(giftCardPageTitle).toHaveText("Gift Card")

    await clearFilterXButton.click()
    await page.waitForLoadState('networkidle')

    await filterButton.click()
    await filterFieldInput.fill(fieldName)

    await filterFieldOption.getByText(fieldName, { exact: true }).click();

    await filterCondition.selectOption({ label: 'Equals' })

    const filterConditionInput = filterField.locator(`input[data-fieldname='${fieldValue}']`)
    await filterConditionInput.clear()

    const reportViewResponse = page.waitForResponse(response => 
        response.url().includes("api/method/frappe.desk.reportview.get") && response.status() === 200
    );

    // const transactionNo = "ACC-PSINV-2026-02104"

    await filterConditionInput.fill(transactionNo)

    const filterConditionInputValue = filterFieldOption.locator(`p[title='${transactionNo}']`)
    await filterConditionInputValue.getByText(transactionNo, { exact: true }).click();
    await page.waitForLoadState('networkidle')

    await applyFiltersButton.click()
    await reportViewResponse;

    const giftCardSerialNos = page.locator("div[class='result'] div[class='list-row-container'] a[data-doctype='Gift Card']")
    const serialNo = await giftCardSerialNos.first().textContent()
    console.log(`Serial No: ${serialNo}`)

    await giftCardSerialNos.first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForLoadState('domcontentloaded')

    const currencyValue = page.locator("div[data-fieldname='balance'] [data-fieldtype='Currency']")
    let balanceValue = await currencyValue.inputValue()
    console.log(`Gift Card Balance : ${balanceValue}`)


    // Switch back to POS Transaction Screen
    await interfacePage.bringToFront()
    
});
