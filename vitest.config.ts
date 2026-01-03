/// <reference types="vitest" />
import { getViteConfig } from "astro/config"
import { configDefaults } from "vitest/config"

export default getViteConfig({
  test: {
    exclude: [...configDefaults.exclude, "e2e/**.test.ts"],
    globals: true,
    setupFiles: ["vitest.setup.ts"],
  },
})
