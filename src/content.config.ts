import fs from "fs"

import { getBlogPostVersionContent, getBlogPostVersions } from "@utils/github"
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

const fileNames = fs.readdirSync("./src/data/blog")

for (const fileName of fileNames) {
  const fileNameWithoutExtension = fileName.replace(".mdx", "")
  const versions = await getBlogPostVersions(fileNameWithoutExtension)

  if (!fs.existsSync(`./src/data/blog-versions`)) {
    fs.mkdirSync(`./src/data/blog-versions`)
  }

  await Promise.all(
    versions.map(async (version) => {
      const content = await getBlogPostVersionContent(
        fileNameWithoutExtension,
        version.sha,
      )
      if (content) {
        fs.writeFileSync(
          `./src/data/blog-versions/${fileNameWithoutExtension}-${version.sha}.mdx`,
          content,
        )
      }
    }),
  )
}

const blogVersions = defineCollection<typeof commonSchema>({
  loader: glob({ pattern: "**/*.mdx", base: "./src/data/blog-versions" }),
  schema: commonSchema,
})

export const collections = { blog, blogVersions }
