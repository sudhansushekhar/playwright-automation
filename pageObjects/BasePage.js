/**
 * BasePage
 * --------
 * Parent class for every page object.
 *
 * Inheritance  : holds the Playwright `page`, the dynamic-UI waits (`this.wait`) and the
 *                actions all screens share, so child pages only describe what is unique to them.
 * Polymorphism : `open()` is a template method - it navigates to `this.path` and then calls
 *                `this.verifyPageLoaded()`, which every page overrides with its own check.
 *                The same call does the right thing for any page:
 *
 *                  await pm.getHomePage().open()          // checks title "Home" + heading
 *                  await pm.getGiftCardListPage().open()  // checks the Gift Card list
 *
 * A child page sets:
 *   this.path               URL under BASE_URL (e.g. 'app/gift-card'); leave null for screens
 *                           that have no URL of their own (POS popups, panels)
 *   verifyPageLoaded()      what "this page is ready" means for that screen
 */
const {expect} = require('@playwright/test')
const {ENV} = require('../config/env')
const {WaitUtils} = require('../utils/WaitUtils')

class BasePage{
    constructor(page){
        this.page = page
        this.wait = new WaitUtils(page)     // see utils/WaitUtils.js
        this.path = null                    // overridden by pages that have their own URL
    }

    /** Readable name for logs and errors (the class name, e.g. "GiftCardListPage"). */
    get pageName(){
        return this.constructor.name
    }

    // ── Template method (same for every page) ─────────────────────

    /** Navigate to this page's URL, then run the page's own load check. */
    async open(){
        if(this.path === null){
            throw new Error(`${this.pageName} has no URL of its own - open it through the screen that shows it`)
        }
        await this.navigateTo(this.path)
        await this.verifyPageLoaded()
        console.log(`${this.pageName} opened`)
    }

    // ── Hook to override (polymorphism) ───────────────────────────

    /** "This page is ready." Every page that can be opened or checked overrides this. */
    async verifyPageLoaded(){
        throw new Error(`${this.pageName} must override verifyPageLoaded()`)
    }

    // ── Shared actions ────────────────────────────────────────────

    /** Open BASE_URL + endpoint (e.g. 'app/gift-card') and wait for the page to load. */
    async navigateTo(endpoint = ''){
        await this.page.goto(ENV.baseUrl + endpoint)
        await this.page.waitForLoadState('load')
    }

    /** Wait until the app has finished its background API calls. */
    async waitForNetworkIdle(){
        await this.page.waitForLoadState('networkidle')
    }

    /** Assert the browser tab title. */
    async verifyTitle(title){
        await expect(this.page).toHaveTitle(title)
    }
}

module.exports = {BasePage};
