// oxlint-disable no-unsafe-argument
import { experimental_AstroContainer as AstroContainer } from "astro/container"

import Link from "./Link.astro"

describe("Link", () => {
  it.each([
    ["https://", "https://example.com"],
    ["mailto:", "mailto:email@example.com"],
  ])("has target _blank if href starts with %s", async (_, href) => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(Link, { props: { href } })

    expect(result).toContain('target="_blank"')
  })

  it.each([
    ["https://", "https://example.com"],
    ["mailto:", "mailto:email@example.com"],
  ])(
    "target can be overwritten to _self if href starts with %s",
    async (_, href) => {
      const container = await AstroContainer.create()
      const result = await container.renderToString(Link, {
        props: { href, target: "_self" },
      })

      expect(result).toContain('target="_self"')
    },
  )

  it.each([["# (anchor)", "#anchor"]])(
    "has target _self if href starts with %s",
    async (_, href) => {
      const container = await AstroContainer.create()
      const result = await container.renderToString(Link, {
        props: { href },
      })

      expect(result).toContain('target="_self"')
    },
  )

  it.each([["# (anchor)", "#anchor"]])(
    "target can be overwritten to _blank if href starts with %s",
    async (_, href) => {
      const container = await AstroContainer.create()
      const result = await container.renderToString(Link, {
        props: { href, target: "_blank" },
      })

      expect(result).toContain('target="_blank"')
    },
  )
})
