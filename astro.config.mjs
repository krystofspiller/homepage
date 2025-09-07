// @ts-check
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"

import tailwindcss from "@tailwindcss/vite"

import alpinejs from "@astrojs/alpinejs"

export default defineConfig({
  integrations: [alpinejs(), mdx()],

  vite: {
    plugins: [tailwindcss()],
  },
})
