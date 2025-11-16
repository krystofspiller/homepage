// oxlint-disable no-await-in-loop
import { getBlogPostVersionContent, getBlogPostVersions } from "@utils/github"
import fs from "node:fs"

const generateBlogVersions = async (): Promise<void> => {
  const fileNames = fs.readdirSync("./src/data/blog")

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".mdx")) {
      continue
    }

    const fileNameWithoutExtension = fileName.replace(".mdx", "")

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
        if (content !== null) {
          fs.writeFileSync(
            `./src/data/blog-versions/${fileNameWithoutExtension}-${version.sha}.mdx`,
            content,
          )
        }
      }),
    )
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await generateBlogVersions()
}
