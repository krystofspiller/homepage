// @ts-check
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import alpinejs from "@astrojs/alpinejs"

// Import and validate environment variables
import "./env"

export default defineConfig({
  // Astro 7 defaults to 'jsx' whitespace rules; keep HTML-aware compression
  // So intentional spaces between inline elements are preserved.
  compressHTML: true,
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
