import { defineConfig, devices } from "@playwright/test"

// Import and validate environment variables
import { env } from "./env"

const isCi = env.ENV === "ci"

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: isCi ? "github" : "list",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4321",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm run dev",
    reuseExistingServer: !isCi,
    url: "http://localhost:4321",
  },
})
