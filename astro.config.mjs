// @ts-check
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import alpinejs from "@astrojs/alpinejs"

// Import and validate environment variables
import "./env"

export default defineConfig({
  integrations: [alpinejs(), mdx()],
  port: 4321,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "alpinejs",
        "astro/virtual-modules/transitions-events.js",
        "astro/virtual-modules/transitions-router.js",
        "astro/virtual-modules/transitions-swap-functions.js",
        "astro/virtual-modules/transitions-types.js",
        "butteruptoasts",
        "canvas-confetti",
        "@floating-ui/dom",
        "gsap",
        "gsap/ScrollTrigger",
        "nanostores",
        "zod",
      ],
    },
  },
})
