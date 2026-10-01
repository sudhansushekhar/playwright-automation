/**
 * Custom fixtures
 * ---------------
 * Extends Playwright's `test` so a spec can ask for ready-made objects instead of
 * building them in every test:
 *
 *   const { test, expect } = require('../fixtures/testFixtures')
 *   test('...', async ({ page, pm, apiUtils, posData, terminalName }) => { ... })
 *
 * Sessions:
 *   - `page` / `pm`  → browser, already logged in via storageState (see playwright.config.js)
 *   - `apiUtils`     → separate API session, logged in through api/method/login
 *
 * Fixtures are test-scoped: they are created for each test that uses them and
 * cleaned up after it. They cannot be used inside beforeAll/afterAll.
 */
const base = require('@playwright/test')
const { PageManager } = require('../pageObjects/PageManager')
const { APIUtils } = require('../utils/APIUtils')
const { ENV } = require('../config/env')
const { getTerminalForWorker } = require('../utils/TerminalPool')
const posData = require('../testData/posData.json')

const test = base.test.extend({

    /** Environment values: base URL and credentials (config/env.js). */
    env: async ({}, use) => {
        await use(ENV)
    },

    /** Business test data (testData/posData.json). */
    posData: async ({}, use) => {
        await use(posData)
    },

    /** This worker's POS terminal (utils/TerminalPool.js). */
    terminalName: async ({}, use, testInfo) => {
        await use(getTerminalForWorker(testInfo))
    },

    /** PageManager for the default (logged-in) `page` tab. */
    pm: async ({ page }, use) => {
        await use(new PageManager(page))
    },

    /**
     * APIUtils with its own logged-in API context.
     * After the test it logs out (frees the server session, see APIUtils.logoutWithAPI) and is disposed.
     */
    apiUtils: async ({ playwright, terminalName }, use) => {
        const apiContext = await playwright.request.newContext()

        const apiUtils = new APIUtils(
            ENV.baseUrl,
            apiContext,
            { usr: ENV.email, pwd: ENV.password },                  // login
            { user: ENV.email, terminal: terminalName },            // get opening entry
            { ...posData.openingEntry, pos_terminal_name: terminalName }, // create opening entry
        )
        await apiUtils.loginWithAPI()

        await use(apiUtils)
        await apiUtils.logoutWithAPI()
        await apiContext.dispose()
    },
})

module.exports = { test, expect: base.expect }
