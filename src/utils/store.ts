import { atom } from "nanostores"

enum EasterEggs {
  US = 1,
  TRAMPOLINE = 2,
  OIIA = 3,
}

const easterEggCounter = atom<EasterEggs[]>([])
const usesSideNavigable = atom<boolean>(false)

export { EasterEggs, easterEggCounter, usesSideNavigable }
