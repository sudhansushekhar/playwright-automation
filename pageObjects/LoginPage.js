/**
 * LoginPage
 * ---------
 * Desk login screen. Used by tests/auth.setup.js, which tests the login page
 * and then saves the logged-in session (storageState) for all other tests.
 */
const {expect} = require('@playwright/test')
const {BasePage} = require('./BasePage')

class LoginPage extends BasePage{
    constructor(page){
        super(page)
        this.path = ''          // app root shows the login screen

        // ── Locators ──────────────────────────────────────────────
        this.welcomeHeading = page.getByRole('heading', { name: 'Welcome Back' });
        this.usernameInput = page.getByRole('textbox', { name: 'Email or Mobile or Username' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    // ── Actions ───────────────────────────────────────────────────

    /** Override (polymorphism): the login form is shown and ready to use. */
    async verifyPageLoaded(){
        await expect(this.page).toHaveTitle('Login');
        await expect(this.welcomeHeading).toBeVisible();
        await expect(this.usernameInput).toBeEditable();
        await expect(this.passwordInput).toBeEditable();
    }

    /** Fill the form and submit it. */
    async login(username, password){
        await this.usernameInput.fill(username)
        await this.passwordInput.fill(password)
        await this.loginButton.click()
    }

    /** Successful login: lands on the Desk home page. */
    async validLogin(username, password){
        await expect(this.page).toHaveTitle('Login');
        await this.login(username, password)
        await expect(this.page).toHaveTitle('Home')
    }
}

module.exports = {LoginPage};
