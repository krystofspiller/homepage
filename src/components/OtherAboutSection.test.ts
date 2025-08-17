import { describe, expect, test } from "vitest"
import { JSDOM } from "jsdom"

describe("OtherAboutSection", () => {
  test("can find count of cards from Knowt", async () => {
    const knowtUrl =
      "https://knowt.com/flashcards/22843cc6-d653-4f27-b0e6-02bdd1e1bc92"
    const response = await fetch(knowtUrl)
    expect(response.ok).toBe(true)

    const dom = new JSDOM(await response.text())
    let cardCount = 0
    for (const span of dom.window.document.querySelectorAll("span")) {
      if (span.textContent?.includes("View all")) {
        const res = span.textContent.match(/\((\d+)\)/)
        cardCount = Number(res?.[1])
        break
      }
    }

    expect(cardCount > 0 && cardCount <= 150)
  })
})
