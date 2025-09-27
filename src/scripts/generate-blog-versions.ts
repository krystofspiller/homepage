/* eslint-disable no-console */
import fs from "fs"

import { getBlogPostVersionContent, getBlogPostVersions } from "@utils/github"

async function generateBlogVersions() {
  const fileNames = fs.readdirSync("./src/data/blog")

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".mdx")) continue

    const fileNameWithoutExtension = fileName.replace(".mdx", "")

    try {
      const versions = await getBlogPostVersions(fileNameWithoutExtension)

      if (!fs.existsSync(`./src/data/blog-versions`)) {
        fs.mkdirSync(`./src/data/blog-versions`, { recursive: true })
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
    } catch (error) {
      console.error(`Error processing ${fileNameWithoutExtension}:`, error)
    }
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBlogVersions().catch(console.error)
}
