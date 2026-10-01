const {expect} = require('@playwright/test')

class GiftCardListPage{
    constructor(page){
    this.page = page
    this.reportViewResponse;


    // Transaction Complete
    this.giftCardPage = page.locator("[id='page-List/Gift Card/List']")
    this.giftCardPageHeading = this.giftCardPage.locator("h3")
    this.clearFilterXButton = this.giftCardPage.locator("[title='Clear all filters']")
    this.filterButton = this.giftCardPage.locator("[class*='filter-button']")
    this.applyFiltersButton = page.locator(".filter-action-buttons button[class*='apply-filters']")

    //filter Popup
    this.filterField = page.locator("div[class*='list_filter']").last()
    this.filterFieldInput = this.filterField.locator("input[role='combobox']").first()
    this.filterFieldOption = this.filterField.locator("ul[role='listbox']:not([hidden])")
    this.filterCondition = this.filterField.locator("select[class*='condition']")

    this.fieldName="POS Invoice"
    this.fieldValue = this.fieldName.toLowerCase().replace(" ", "_");

    this.giftCardSerialNos = page.locator("div[class='result'] div[class='list-row-container'] a[data-doctype='Gift Card']")
    this.currencyValue = page.locator("div[data-fieldname='balance'] [data-fieldtype='Currency']")

    }

    async verifyGiftCardPage(){
        await expect(this.page).toHaveTitle("Gift Card")
        await expect(this.giftCardPageHeading).toHaveText("Gift Card")
    }

    async clearAllFilters(){
        await this.clearFilterXButton.click()
        await this.page.waitForLoadState('networkidle')
    }

    async addFilter(){
        await this.filterButton.click()
    }
    //"POS Invoice", Equals, transactionNo
    async fillFilterDetails(fieldName, filterCondition, filterConditionValue){    
        // const fieldName="POS Invoice"
        const fieldValue = fieldName.toLowerCase().replace(" ", "_");
        
        await this.filterFieldInput.fill(fieldName)

        await this.filterFieldOption.getByText(fieldName, { exact: true }).click();

        await this.filterCondition.selectOption({ label: filterCondition })

        const filterConditionInput = this.filterField.locator(`input[data-fieldname='${fieldValue}']`)
        await filterConditionInput.clear()

        this.reportViewResponse = this.page.waitForResponse(response => 
            response.url().includes("api/method/frappe.desk.reportview.get") && response.status() === 200
        );

        // const transactionNo = "ACC-PSINV-2026-02104"
        await filterConditionInput.fill(filterConditionValue)

        const filterConditionInputValue = this.filterFieldOption.locator(`p[title='${filterConditionValue}']`)
        await filterConditionInputValue.getByText(filterConditionValue, { exact: true }).click();
        await this.page.waitForLoadState('networkidle')
    }

    async applyFilters(){
        await this.applyFiltersButton.click()
        await this.reportViewResponse;
    }

    async clickFilteredSerialNo(){
        const serialNo = await this.giftCardSerialNos.first().textContent()
        console.log(`Serial No: ${serialNo}`)

        await this.giftCardSerialNos.first().click()
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForLoadState('domcontentloaded')

    }

    async getGiftCardBalanceValue(){
        let balanceValue = await this.currencyValue.inputValue()
        console.log(`Gift Card Balance : ${balanceValue}`)
        return balanceValue
    }
}

module.exports = {GiftCardListPage};