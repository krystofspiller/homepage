import { z } from "zod"
import { atom } from "nanostores"

const EasterEggs = z.enum(["NORTH_AMERICA", "TRAMPOLINE", "OIIA"])
type EasterEgg = z.infer<typeof EasterEggs>

const easterEggCounter = atom<EasterEgg[]>([])
const usesSideNavigable = atom<boolean>(false)

export { EasterEggs, easterEggCounter, usesSideNavigable }
