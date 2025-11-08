// oxlint-disable no-await-in-loop
// oxlint-disable no-console

import { join, relative } from "node:path"
import { readFile, readdir } from "node:fs/promises"
import { execSync } from "node:child_process"

const isCi = process.argv[2] === "ci"

const setup = (): void => {
  console.log("Setup - pull curl-impersonate chrome")
  const output = execSync("docker pull lwthiker/curl-impersonate:0.6-chrome", {
    encoding: "utf8",
  })
  console.log("Docker pull curl-impersonate chrome:\n", output)
}

const checkLink = (
  link: string,
): { httpCode: string | undefined; redirectUrl: string | undefined } => {
  const output = execSync(
    `docker run --platform linux/amd64 --rm lwthiker/curl-impersonate:0.6-chrome curl_chrome116 --silent --output /dev/null -w "%{http_code};%{redirect_url}" ${link}`,
    { encoding: "utf8" },
  )
  const [httpCode, redirectUrl] = output.split(";")
  return { httpCode, redirectUrl }
}

interface FileInfo {
  path: string
  content: string
  isDirectory: boolean
}

// Function to read and parse .gitignore file
const getGitignorePatterns = async (projectRoot: string): Promise<string[]> => {
  const additionalPatterns = [
    ".git*",
    ".vscode*",
    "*.gif",
    "*.png",
    "*.avif",
    "*.jpg",
  ]
  try {
    const gitignorePath = join(projectRoot, ".gitignore")
    const content = await readFile(gitignorePath, "utf8")

    return [
      ...content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#")) // Remove empty lines and comments
        .map((pattern) => {
          let modifiedPattern = pattern
          // Remove leading slash if present
          if (pattern.startsWith("/")) {
            modifiedPattern = modifiedPattern.slice("/".length)
          }
          // Remove trailing slash if present
          if (pattern.endsWith("/")) {
            modifiedPattern = modifiedPattern.slice(0, -"/".length)
          }
          return modifiedPattern
        }),
      ...additionalPatterns,
    ].filter((pattern, index, arr) => arr.indexOf(pattern) === index) // Remove duplicates
  } catch {
    console.warn("Could not read .gitignore file, using default patterns")
    return [
      ...additionalPatterns,
      ".wrangler",
      "node_modules",
      "dist",
      ".astro",
    ]
  }
}

// Function to check if should be ignored based on ignore patterns
const shouldIgnore = (name: string, ignorePatterns: string[]): boolean =>
  ignorePatterns.some((pattern) => {
    // Exact match
    if (pattern === name) {
      return true
    }

    // Pattern with wildcard (simple implementation)
    if (pattern.includes("*")) {
      const regexPattern = pattern.replaceAll("*", ".*")
      return new RegExp(`^${regexPattern}$`).test(name)
    }

    return false
  })

// Function to extract HTTP/HTTPS links from text
const extractLinks = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"|\\^`[\]]+/g
  const matches = text.match(urlRegex) || []

  // Clean up URLs
  return matches
    .map((url) => url.replace(/[.,;?)\]>"'`]+$/, ""))
    .filter((url, index, arr) => arr.indexOf(url) === index) // Remove duplicates
    .filter((url) => !/\${.+}/.test(url)) // Remove URLs with variable interpolation
    .filter((url) => !url.includes("www.w3.org")) // Remove W3C URLs
    .filter((url) => !url.includes("localhost")) // Remove localhost URLs
    .filter((url) => !url.endsWith("/*")) // Remove URLs ending with wildcard (used in tests)
}

const readAllFiles = async (
  dir: string,
  gitignorePatterns: string[],
  baseDir: string = dir,
): Promise<FileInfo[]> => {
  const files: FileInfo[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (shouldIgnore(entry.name, gitignorePatterns)) {
        continue
      }

      const fullPath = join(dir, entry.name)
      const relativePath = relative(baseDir, fullPath)

      if (entry.isDirectory()) {
        files.push({
          content: "",
          isDirectory: true,
          path: relativePath,
        })

        // Recursively read subdirectories
        const subFiles = await readAllFiles(
          fullPath,
          gitignorePatterns,
          baseDir,
        )
        files.push(...subFiles)
      } else {
        try {
          const content = await readFile(fullPath, "utf8")

          files.push({
            content,
            isDirectory: false,
            path: relativePath,
          })
        } catch {
          // Skip files that can't be read (like binary files)
          console.warn(`Could not read file: ${relativePath}`)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return files
}

const main = async (): Promise<void> => {
  const projectRoot = process.cwd()

  const gitignorePatterns = await getGitignorePatterns(projectRoot)
  console.log(
    `Searching files (ignoring the following patterns: ${gitignorePatterns.join(", ")})`,
  )

  const allFiles = await readAllFiles(
    projectRoot,
    gitignorePatterns,
    projectRoot,
  )

  console.log(`Found ${allFiles.length} files and directories:`)

  // Group files by type
  const directories = allFiles.filter((f) => f.isDirectory)
  const textFiles = allFiles.filter((f) => !f.isDirectory)

  console.log(`  Directories (${directories.length}):`)
  for (const dir of directories) {
    console.log(`    📁 ${dir.path}`)
  }

  console.log(`  Text Files (${textFiles.length}):`)
  for (const file of textFiles) {
    console.log(`    📄 ${file.path}`)
  }

  console.log("\nExtracing links in these files:")

  const links = new Set<string>()

  for (const file of textFiles) {
    const extractedLinks = extractLinks(file.content)

    for (const link of extractedLinks) {
      if (links.has(link)) {
        console.log(`  🗑️🔗 Ignored a duplicate link ${link} in ${file.path}`)
      } else {
        console.log(`  ✅🔗 Added link ${link} in ${file.path}`)
        links.add(link)
      }
    }
  }

  console.log(`\nChecking ${links.size} found links:`)

  const fails: {
    link: string
    httpCode: string | undefined
    redirectUrl: string | undefined
  }[] = []
  const expectedFails = [
    ["999", "https://www.linkedin.com/in/krystof-spiller"],
    ["999", "https://www.linkedin.com/in/maria-muhandes"],
    ["302", "https://player.vimeo.com"],
    ...(isCi
      ? [
          "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
          "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap",
          "https://open.spotify.com/embed/playlist/1i1czz9lUslWTzFr5cHomk?utm_source=generator&theme=0",
          "https://player.vimeo.com/video/1065493306?autoplay=1&dnt=1&background=1",
          "https://en.wikipedia.org/w/index.php?title=List_of_circulating_currencies&oldid=1275996218#:~:text=There%20are%20180%20currencies",
          "https://player.vimeo.com/video/885736465?autoplay=1&dnt=1&background=1",
          "https://player.vimeo.com/video/1065496020?autoplay=1&dnt=1&background=1",
        ]
      : []),
  ]
  for (const link of links) {
    const { httpCode, redirectUrl } = checkLink(link)
    if (httpCode === "200") {
      console.log(`  ✅ ${link}`)
    } else {
      console.log(`  ❌ ${link} ${httpCode} ${redirectUrl}`)
      fails.push({ httpCode, link, redirectUrl })
    }
  }

  if (
    expectedFails.length === fails.length &&
    fails.every((fail) =>
      expectedFails.some(
        (expected) =>
          expected[0] === fail.httpCode && expected[1] === fail.link,
      ),
    )
  ) {
    console.log(
      `\n✅ Found ${expectedFails.length} expected fails. Total links checked: ${links.size}. `,
    )
  } else {
    console.log(`\n❌ Found ${fails.length} failed links:`)
    for (const [index, fail] of fails.entries()) {
      const isExpected = expectedFails.some(
        (expected) =>
          expected[0] === fail.httpCode && expected[1] === fail.link,
      )
      console.log(
        `  ${index + 1}. ${isExpected ? "" : "(UNEXPECTED)"} ${fail.link} ${fail.httpCode} ${fail.redirectUrl}`,
      )
    }
    throw new Error("Failed links")
  }
}

setup()
await main()
