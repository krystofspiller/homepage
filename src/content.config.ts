import { glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"

export const commonSchema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
  draft: z.boolean().optional(),
})

const blog = defineCollection<typeof commonSchema>({
  loader: glob({ pattern: "**/*.mdx", base: "./src/data/blog" }),
  schema: commonSchema,
})

const blogVersions = defineCollection<typeof commonSchema>({
  loader: glob({ pattern: "**/*.mdx", base: "./src/data/blog-versions" }),
  schema: commonSchema,
})

export const collections = { blog, blogVersions }
