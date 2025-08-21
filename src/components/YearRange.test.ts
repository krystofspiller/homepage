import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { JSDOM } from "jsdom"
import { describe, expect, test } from "vitest"

import YearRange from "./YearRange.astro"

const currentYear = new Date().getFullYear()

async function renderYearRangeGetTextContent(
  from: number,
  to?: number,
  note?: string,
) {
  const container = await AstroContainer.create()
  const dom = new JSDOM(
    await container.renderToString(YearRange, {
      props: { from, to, note },
    }),
  )

  return dom.window.document.querySelector("span")?.textContent
}

describe("YearRange", () => {
  test("return range given valid from and to", async () => {
    let result = await renderYearRangeGetTextContent(2022, 2024)

    expect(result).toContain("2022-2024")

    result = await renderYearRangeGetTextContent(2022, currentYear)

    expect(result).toContain(`2022-${currentYear}`)
  })

  test("return range with note given valid from and to and note", async () => {
    const note = "part-time"
    let result = await renderYearRangeGetTextContent(2022, 2024, note)

    expect(result).toContain(`2022-2024 (${note})`)

    result = await renderYearRangeGetTextContent(2022, currentYear, note)

    expect(result).toContain(`2022-${currentYear} (${note})`)
  })

  test("return from to Now given larger from than to if from is current year", async () => {
    const result = await renderYearRangeGetTextContent(currentYear, 2022)

    expect(result).toBe(`${currentYear}-Now`)
  })

  test("return from to Now given from as current year", async () => {
    const result = await renderYearRangeGetTextContent(currentYear)

    expect(result).toBe(`${currentYear}-Now`)
  })

  test("return range to current year given from smaller than current year", async () => {
    const result = await renderYearRangeGetTextContent(2023)

    expect(result).toBe(`2023-${currentYear}`)
  })

  test("return range to current year given larger from than to and from being smaller than current year", async () => {
    const result = await renderYearRangeGetTextContent(2024, 2022)

    expect(result).toBe(`2024-${currentYear}`)
  })
})
