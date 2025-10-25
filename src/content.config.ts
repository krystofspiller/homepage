import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const commonSchema = z.object({
  draft: z.boolean().optional(),
  pubDate: z.coerce.date(),
  title: z.string(),
})

const blog = defineCollection<typeof commonSchema>({
  loader: glob({ base: "./src/data/blog", pattern: "**/*.mdx" }),
  schema: commonSchema,
})

const blogVersions = defineCollection<typeof commonSchema>({
  loader: glob({ base: "./src/data/blog-versions", pattern: "**/*.mdx" }),
  schema: commonSchema,
})

export const collections = { blog, blogVersions }
