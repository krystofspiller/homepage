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
  },
})
