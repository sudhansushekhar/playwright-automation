// @ts-check
import { defineConfig } from '@playwright/test';
import reportingLabs from './reporting-labs.config';



export default defineConfig({
  testDir: './tests',

  /* Max timeout for a test case */
  timeout: 30 * 1000,

  /* Run all tests in parallel. */
  fullyParallel: false,

  /* Assertions and validation time out */
  expect : {
    timeout: 10 * 1000
  },

  /* Reporter to use. */
  reporter: [
    // ['html'],
    ['list'],
    ['reporting-labs', reportingLabs]
  ],
projects : [
  {
    name : 'safari',
    use: {
      browserName: 'webkit',
      headless: false,
      screenshot : 'on',
      trace : 'retain-on-failure',
      viewport: { width: 1600, height: 800 },
    },
  },
  {
    name : 'chrome',
    use: {
      browserName: 'chromium',
      headless: false,
      screenshot : 'only-on-failure',
      trace : 'retain-on-failure',
      viewport: { width: 1600, height: 800 },
    },
  }
],
  
});
