/**
 * Environment configuration
 * -------------------------
 * One place for everything that changes between machines / environments.
 *   Local : values come from `.env` (copy `.env.example`, git-ignored)
 *   CI    : values come from GitHub Secrets (see .github/workflows/playwright.yml)
 *
 *   const { ENV } = require('../config/env')
 *   await page.goto(ENV.baseUrl + 'app/home')
 */
require('dotenv').config({ quiet: true })

/** Read a variable that must be set; fail with a clear message if it is missing. */
function required(name) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing environment variable "${name}". Copy .env.example to .env (local) or add it as a GitHub Secret (CI).`)
    }
    return value
}

// Always end the base URL with "/" so "baseUrl + 'app/home'" works everywhere
const baseUrl = (process.env.BASE_URL || 'http://localhost:8080/').replace(/\/?$/, '/')

const ENV = {
    baseUrl,
    origin: new URL(baseUrl).origin,
    testEnv: process.env.TEST_ENV || 'local',

    /** Logged-in session saved by tests/auth.setup.js and reused via storageState. */
    authFile: 'playwright/.auth/user.json',

    // Getters: a missing secret only fails the test that reads it, never test discovery
    get username() { return required('APP_USERNAME') },
    get email() { return required('APP_EMAIL') },
    get password() { return required('APP_PASSWORD') },

    /** Server-side module that hosts the POS API, e.g. api/method/<module>.api.point_of_sale... */
    get posApiModule() { return required('POS_API_MODULE') },
}

module.exports = { ENV }
