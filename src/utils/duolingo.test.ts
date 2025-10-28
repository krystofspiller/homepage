import { getDuolingoStreak } from "./duolingo"

describe("Duolingo API", () => {
  it("should fetch latest YouTube video", async () => {
    const streak = await getDuolingoStreak()
    expect(streak).not.toBeNull()
    expect(typeof streak).toBe("number")
    expect(streak).toBeGreaterThan(0)
  })
})
