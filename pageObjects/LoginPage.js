const {expect} = require('@playwright/test')


class LoginPage{
    constructor(page){
    this.page = page
    this.usernameInput = page.getByRole('textbox', { name: 'Email or Mobile or Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    async goTo(newPageEndpoint){
        const baseUrl = "http://localhost:8080/"

        if(newPageEndpoint==null){
            await this.page.goto(baseUrl)
            await this.page.waitForLoadState('load');
        } else {
            await this.page.goto(baseUrl+newPageEndpoint);
            await this.page.waitForLoadState('load');
        }
    }

    async validLogin(username, password){
        await expect(this.page).toHaveTitle("Login");
        await this.usernameInput.fill(username)
        await this.passwordInput.fill(password)
        await this.loginButton.click()

        await expect(this.page).toHaveTitle('Home')
    }
}

module.exports = {LoginPage};