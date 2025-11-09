import { atom } from "nanostores"

enum EasterEggs {
  NORTH_AMERICA = 1,
  TRAMPOLINE = 2,
  OIIA = 3,
}

const easterEggCounter = atom<EasterEggs[]>([])
const usesSideNavigable = atom<boolean>(false)

export { EasterEggs, easterEggCounter, usesSideNavigable }
