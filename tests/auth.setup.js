/**
 * Login page test + session setup  (project: `setup`)
 * ===================================================
 * Runs before the browser projects (chrome / safari depend on it).
 *
 *   The login page renders, a valid login reaches Desk home, and the session is
 *   saved to playwright/.auth/user.json (git-ignored).
 *
 * Every other browser test starts from that saved session (storageState in
 * playwright.config.js), so no other spec has to log in through the UI.
 *
 * Tagged @web and @API so `--grep @web` / `--grep @API` runs still create the session.
 */
const { test: setup } = require('@playwright/test')
const { meta } = require('reporting-labs')
const { ENV } = require('../config/env')
const { PageManager } = require('../pageObjects/PageManager')

setup('login with valid user and save session', { tag: ['@web', '@API'] }, async ({ page }) => {
    meta({ priority: 'P0', severity: 'blocker', feature: 'Login', owner: 'Sudhanshu Shekhar' })
    const pm = new PageManager(page)

    // Log in through the real login page
    await pm.getLoginPage().open()              // navigates + LoginPage.verifyPageLoaded()
    await pm.getLoginPage().validLogin(ENV.username, ENV.password)
    await pm.getHomePage().open()               // navigates + HomePage.verifyPageLoaded()

    // Save cookies + localStorage for every test that follows
    await page.context().storageState({ path: ENV.authFile })
})
