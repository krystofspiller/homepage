import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Krystof Spiller/)
})

test("see more reveals more content", async ({ page }) => {
  const text = page.getByText(
    "These integrations periodically check for updates from terminals, match their schedules with Portchain's data and synchronize between the two.",
  )

  await expect(text).not.toBeVisible()

  await page
    .getByRole("paragraph")
    .filter({ hasText: "I've integrated Portchain's" })
    .getByText("See more...")
    .click()

  await expect(text).toBeVisible()
})

test("show large profile pic on hove", async ({ page }) => {
  const link = page.getByRole("link", { name: "Krystof's profile" })

  await expect(link).not.toBeVisible()

  await page.getByRole("img", { name: "Krystof's profile" }).hover()

  await expect(link).toBeVisible()
})

test.only("no console errors or warnings", async ({ page }) => {
  const consoleMessages: string[] = []
  const ignoredMessages = ["warning: Unrecognized feature: 'web-share'."]

  page.on("console", (msg) => {
    if (msg.type() === "debug") {
      return
    }

    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
  })

  // Navigate to the page and wait for it to load
  await page.goto("/")
  await page.waitForLoadState("networkidle")

  expect(consoleMessages.sort()).toEqual(ignoredMessages.sort())
})

test.describe("easter eggs", () => {
  test("clicking North America triggers easter egg", async ({ page }) => {
    const easterEgg = page.getByRole("img", { name: "Easter egg #1" })

    await expect(easterEgg).not.toBeVisible()

    await page.getByText("North America").click()

    await expect(easterEgg).toBeVisible()
  })

  test("clicking Trampoline image triggers easter egg", async ({ page }) => {
    const easterEgg = page.getByRole("img", { name: "Easter egg #2" })

    await expect(easterEgg).not.toBeVisible()

    await page
      .getByRole("img", { name: "Example Slack message of new app release" })
      .click()

    await expect(easterEgg).toBeVisible()
  })

  test("clicking cat in Education triggers easter egg", async ({ page }) => {
    const easterEgg = page.getByRole("img", { name: "Easter egg #3" })

    await expect(easterEgg).not.toBeVisible()

    const heading = page.getByRole("heading", { name: "Edu cation" })
    await heading.getByText("cat").click()

    await expect(easterEgg).toBeVisible()
  })
})
