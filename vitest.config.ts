/// <reference types="vitest" />
import { getViteConfig } from "astro/config"
import { defineConfig } from "vitest/config"

export default getViteConfig(
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./src/test-setup.ts"],
    },
  }),
)
