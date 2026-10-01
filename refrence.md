# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UIBasicTest.spec.js >> Page Playwright Test
- Location: tests\UIBasicTest.spec.js:11:1

# Error details

```
ReferenceError: expect is not defined
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "Home" [ref=e4] [cursor=pointer]:
        - /url: /
      - list [ref=e6]:
        - listitem [ref=e7]:
          - link "Login" [ref=e8] [cursor=pointer]:
            - /url: /login
  - generic [ref=e9]:
    - generic:
      - main:
        - generic [ref=e17]:
          - generic [ref=e19]:
            - heading "Welcome Back" [level=2] [ref=e20]
            - paragraph [ref=e21]: Login your account and start your business
          - form [ref=e22]:
            - generic [ref=e23]:
              - textbox "Email or Mobile or Username" [active] [ref=e26]
              - generic [ref=e31]:
                - textbox "Password" [ref=e32]:
                  - /placeholder: " Password"
                - generic [ref=e35] [cursor=pointer]
            - generic [ref=e40]:
              - button "Login" [ref=e42] [cursor=pointer]
              - link "Forgot Password?" [ref=e45] [cursor=pointer]:
                - /url: "#forgot"
  - contentinfo [ref=e46]:
    - generic [ref=e47]:
      - generic [ref=e52]:
        - textbox "Your email address..." [ref=e53]
        - button "Get Updates" [ref=e55] [cursor=pointer]
      - generic [ref=e59]:
        - text: Powered by
        - link "iVendNext" [ref=e60] [cursor=pointer]:
          - /url: http://docs.ivendnext.com?source=website_footer
```

# Test source

```ts
  1  | const {test} = require('@playwright/test')
  2  | 
  3  | // test('Browser Context Playwright Test', async ({browser}) => {    // Here browser is a fixture inside {} as {browser}
  4  | //     // Playwright Code now
  5  | //     const context = await browser.newContext();
  6  | //     const page = await context.newPage();
  7  | 
  8  | //     page.goto("https://google.com/")
  9  | // });
  10 | 
  11 | test('Page Playwright Test', async ({page}) => {    // Here page is palywright page context, no need to define browser context separately
  12 |     // Playwright Code now
  13 | 
  14 |     await page.goto("https://automationtesting.staging.ivendnext.com/")
> 15 |     await expect(page).toHaveTitle("Home")
     |     ^ ReferenceError: expect is not defined
  16 | });
```