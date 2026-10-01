const {test, expect} = require('@playwright/test')

test.only('Gift Card Sale E2E test', async ({browser}) => {    
    // Playwright Code now

    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = "http://localhost:8080/"
    await page.goto(baseUrl);
    await expect(page).toHaveTitle("Login");

    // Enter Details to login
    await page.getByRole('textbox', { name: 'Email or Mobile or Username' }).fill("cicd");
    await page.getByRole('textbox', { name: 'Password' }).fill("Pass@123");
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveTitle("Home");
    console.log(await page.locator("div h3[class*='title-text']").textContent());
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.locator('a').filter({ hasText: /^Retail$/ }).click();
    await expect(page).toHaveTitle("Retail");
    
    // click 'iVendNext POS' to open new tab
    const interfacePagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'iVendNext POS' }).click();
    const interfacePage = await interfacePagePromise;

    
    // POS TERMINAL SELECTION
    const posTerminalWindow = interfacePage.getByRole('heading', { name: 'Select POS Terminal' })
    const isWindowVisible = await posTerminalWindow.isVisible();

    if(!isWindowVisible){
        console.log("⚠️ POS Terminal window is hidden or not rendered. Refreshing page...");

        await interfacePage.reload()
        await interfacePage.waitForLoadState('load');

        await expect(posTerminalWindow).toBeVisible()
        await expect(interfacePage.locator('#pos_terminal_windowHeader')).toContainText('Select POS Terminal');

    } else {
        console.log("✅ POS Terminal window detected successfully.");
    }

    
    // Select Terminal
    const terminalName = "CI-CD Terminal";
    await interfacePage.getByRole('button', { name: 'Select POS Terminal' }).click();
    await interfacePage.locator('div').filter({ hasText: `${terminalName}` }).click();
    await interfacePage.getByText('Submit').click();
    await interfacePage.waitForLoadState('networkidle')
    
    await interfacePage.getByText('Submit').waitFor({ state: 'hidden', timeout: 5000 });
    await interfacePage.waitForTimeout(1000);

    
    // POS Opening Entery Popup

    const openingAmountWindow = interfacePage.locator("smart-window #open_shift_windowHeader")
    const isVisible = await expect(openingAmountWindow).toBeVisible();

    if(isVisible){
        console.log("👉 Opening Shift Window detected. Processing shift amounts...");
        await expect(openingAmountWindow).toContainText('Opening Amount');
        

        const denominationColumnName = "10";
        const denominationCountValue = "2";
        const calculatedAmount = parseInt(denominationColumnName) * parseInt(denominationCountValue)
    
        await interfacePage.locator('input[name="pos_terminal"]').click();
        await expect(interfacePage.locator('input[name="pos_terminal"]')).toHaveValue(`${terminalName}`);

        await interfacePage.getByRole('textbox').click();
        await interfacePage.getByRole('textbox').fill('10');
        await interfacePage.getByRole('textbox').press('Tab');
        
        await expect(interfacePage.locator('#gridcell_bbbf')).toContainText('100');
        await expect(interfacePage.locator('input[name="opening_amount"]')).toHaveValue('100');
        await interfacePage.getByText('Start Selling').click();
        

        await openingAmountSubmitButton.click()

        await expect(openingAmountWindow.toBeHidden());
        // expect(await openingAmountWindow.toBeVisible()).toBeFalsy();
    
    } else {
        console.log("ℹ️ Opening Shift Window did not appear. Moving straight to POS Dashboard.");
    }

    // POS Dashboard Landing
    const defaultTransactionMode = interfacePage.getByRole('heading', { name: 'Mode: Sale' })
    await expect(defaultTransactionMode).toBeVisible();
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
