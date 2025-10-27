import { z } from "zod"

const duolingoSchema = z.object({
  streak: z.number(),
})

export const getDuolingoStreak = async (): Promise<number | null> => {
  try {
    const response = await fetch(
      "https://www.duolingo.com/2017-06-30/users/1102654541",
    )
    if (!response.ok) {
      return null
    }

    const json = await response.json()
    const { streak } = duolingoSchema.parse(json)
    return streak
  } catch {
    return null
  }
}
