/**
 * TerminalPool
 * ------------
 * One POS terminal per worker, so parallel workers never fight over the same terminal
 * (a terminal bound to one browser disappears from the POS dropdown for all others).
 *
 *   Terminals : testData/posData.json → "terminals" (each one must exist in the app)
 *   Workers   : WORKERS env variable (playwright.config.js), default 1
 *
 * Worker 0 uses terminals[0], worker 1 uses terminals[1], and so on. Playwright's
 * `parallelIndex` stays the same when a worker restarts after a failure, so a restarted
 * worker keeps its terminal.
 *
 *   test.beforeAll(async ({ browser }, testInfo) => {
 *       terminalName = getTerminalForWorker(testInfo)
 *   })
 *
 * Inside a test, use the `terminalName` fixture instead (fixtures/testFixtures.js).
 */
const posData = require('../testData/posData.json')

/** @param {import('@playwright/test').TestInfo} testInfo */
function getTerminalForWorker(testInfo) {
    const terminals = posData.terminals
    const index = testInfo.parallelIndex

    if (index >= terminals.length) {
        throw new Error(
            `Worker ${index} has no POS terminal: testData/posData.json lists ${terminals.length}. ` +
            `Add a terminal there (and create it in the app), or run with fewer workers.`
        )
    }
    return terminals[index]
}

module.exports = { getTerminalForWorker }
