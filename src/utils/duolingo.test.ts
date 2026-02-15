import { getDuolingoStreak } from "./duolingo"
import { server } from "@mocks/node"
import { http, passthrough } from "msw"

describe("Duolingo API", () => {
  it("should fetch Duolingo stream", async () => {
    server.use(http.get("https://www.duolingo.com/*", passthrough))

    const streak = await getDuolingoStreak()
    expect(streak).not.toBeNull()
    expectTypeOf(streak).toBeNumber()
    expect(streak).toBeGreaterThan(0)
  })
})
