import { z } from "zod"
import { atom } from "nanostores"

const EasterEggs = z.enum(["NORTH_AMERICA", "TRAMPOLINE", "OIIA"])
type EasterEggs = z.infer<typeof EasterEggs>

const easterEggCounter = atom<EasterEggs[]>([])
const usesSideNavigable = atom<boolean>(false)

export { EasterEggs, easterEggCounter, usesSideNavigable }
