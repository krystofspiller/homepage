/* eslint-disable no-unused-vars */
import { atom } from "nanostores"

enum EasterEggs {
  US = 1,
  TRAMPOLINE = 2,
  OIIA = 3,
}

export const easterEggCounter = atom<Array<EasterEggs>>([])
export const usesSideNavigable = atom<boolean>(false)

export { EasterEggs }
