const {expect} = require('@playwright/test')

class GiftCardSearchPage{
    constructor(page){
    this.page = page
    this.giftCardSearchPage = page.locator("#gift_card_sale_html h5");
    this.giftCardSearchPageSearchInput = page.locator("#gift_card_sale_search_as_you_type input");
    this.giftCardSearchPageItemLine = page.locator("smart-grid-cell[data-field='tabItem.item_code'] div");
    this.giftCardSearchPageSelectedItem = page.locator("smart-grid-cell[data-field='tabItem.item_code'][aria-selected='true'] div");
    this.giftCardSearchPageOkButton = page.locator("ivend-button#gift_card_sale_ok button");


    }

    async verifyGiftCardPage(){
        await expect(this.giftCardSearchPage).toBeVisible()
        await expect(this.giftCardSearchPage).toHaveText("Gift Card Sale")
    }

    async searchAndAddGiftCard(giftCardItemCode){
        await this.giftCardSearchPageSearchInput.fill(giftCardItemCode)
        await this.page.waitForLoadState('domcontentloaded')
        await this.page.waitForLoadState('load')

        await this.giftCardSearchPageItemLine.getByText(giftCardItemCode).click();
        await this.page.waitForLoadState('domcontentloaded')

        await expect(this.giftCardSearchPageSelectedItem).toBeVisible()

        await this.giftCardSearchPageOkButton.click()
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForLoadState('domcontentloaded')
    }
}

module.exports = {GiftCardSearchPage};