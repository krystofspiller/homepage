/// <reference types="vitest" />
import { getViteConfig } from "astro/config"
import { configDefaults } from "vitest/config"

export default getViteConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/**.spec.ts"],
    globals: true,
    setupFiles: ["vitest.setup.ts"],
  },
})
