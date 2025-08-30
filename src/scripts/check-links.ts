/* eslint-disable no-console */
import { execSync } from "child_process"
import { readdir, readFile } from "fs/promises"
import { join, relative } from "path"

const isCi = process.argv[2] === "ci"

function setup() {
  console.log("Setup - pull curl-impersonate chrome")
  const output = execSync("docker pull lwthiker/curl-impersonate:0.6-chrome", {
    encoding: "utf-8",
  })
  console.log("Docker pull curl-impersonate chrome:\n", output)
}

function checkLink(link: string) {
  const output = execSync(
    `docker run --platform linux/amd64 --rm lwthiker/curl-impersonate:0.6-chrome curl_chrome116 --silent --output /dev/null -w "%{http_code};%{redirect_url}" ${link}`,
    { encoding: "utf-8" },
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
async function getGitignorePatterns(projectRoot: string): Promise<string[]> {
  const additionalPatterns = [".git*", ".vscode*", "*.gif", "*.png", "*.jpg"]
  try {
    const gitignorePath = join(projectRoot, ".gitignore")
    const content = await readFile(gitignorePath, "utf-8")

    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")) // Remove empty lines and comments
      .map((pattern) => {
        // Remove leading slash if present
        if (pattern.startsWith("/")) {
          pattern = pattern.slice(1)
        }
        // Remove trailing slash if present
        if (pattern.endsWith("/")) {
          pattern = pattern.slice(0, -1)
        }
        return pattern
      })
      .concat(additionalPatterns)
      .filter((pattern, index, arr) => arr.indexOf(pattern) === index) // Remove duplicates
  } catch (error) {
    console.warn("Could not read .gitignore file, using default patterns")
    return additionalPatterns.concat([
      ".wrangler",
      "node_modules",
      "dist",
      ".astro",
    ])
  }
}

// Function to check if should be ignored based on ignore patterns
function shouldIgnore(name: string, ignorePatterns: string[]): boolean {
  return ignorePatterns.some((pattern) => {
    // Exact match
    if (pattern === name) return true

    // Pattern with wildcard (simple implementation)
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\*/g, ".*")
      return new RegExp(`^${regexPattern}$`).test(name)
    }

    return false
  })
}

// Function to extract HTTP/HTTPS links from text
function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"|\\^`[\]]+/g
  const matches = text.match(urlRegex) || []

  // Clean up URLs
  return matches
    .map((url) => url.replace(/[.,;?)\]>"'`]+$/, ""))
    .filter((url, index, arr) => arr.indexOf(url) === index) // Remove duplicates
    .filter((url) => !url.match(/\${.+}/)) // Remove URLs with variable interpolation
    .filter((url) => !url.includes("www.w3.org")) // Remove URLs from W3C
}

async function readAllFiles(
  dir: string,
  baseDir: string = dir,
  gitignorePatterns: string[],
): Promise<FileInfo[]> {
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
          path: relativePath,
          content: "",
          isDirectory: true,
        })

        // Recursively read subdirectories
        const subFiles = await readAllFiles(
          fullPath,
          baseDir,
          gitignorePatterns,
        )
        files.push(...subFiles)
      } else {
        try {
          const content = await readFile(fullPath, "utf-8")

          files.push({
            path: relativePath,
            content,
            isDirectory: false,
          })
        } catch (error) {
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

async function main() {
  const projectRoot = process.cwd()

  try {
    const gitignorePatterns = await getGitignorePatterns(projectRoot)
    console.log(
      `Searching files (ignoring the following patterns: ${gitignorePatterns.join(", ")})`,
    )

    const allFiles = await readAllFiles(
      projectRoot,
      projectRoot,
      gitignorePatterns,
    )

    console.log(`Found ${allFiles.length} files and directories:`)

    // Group files by type
    const directories = allFiles.filter((f) => f.isDirectory)
    const textFiles = allFiles.filter((f) => !f.isDirectory)

    console.log(`  Directories (${directories.length}):`)
    directories.forEach((dir) => {
      console.log(`    📁 ${dir.path}`)
    })

    console.log(`  Text Files (${textFiles.length}):`)
    textFiles.forEach((file) => {
      console.log(`    📄 ${file.path}`)
    })

    console.log("\nExtracing links in these files:")

    const links = new Set<string>()

    textFiles.forEach((file) => {
      const extractedLinks = extractLinks(file.content)

      extractedLinks.forEach((link) => {
        if (links.has(link)) {
          console.log(`  🗑️🔗 Ignored a duplicate link ${link} in ${file.path}`)
        } else {
          console.log(`  ✅🔗 Added link ${link} in ${file.path}`)
          links.add(link)
        }
      })
    })

    console.log(`\nChecking ${links.size} found links:`)

    const fails: { link: string; httpCode: string; redirectUrl: string }[] = []
    const expectedFails = [
      "https://www.linkedin.com/in/krystof-spiller",
      "https://www.linkedin.com/in/maria-muhandes",
    ].concat(
      isCi
        ? [
            "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
            "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap",
            "https://open.spotify.com/embed/playlist/1i1czz9lUslWTzFr5cHomk?utm_source=generator&theme=0",
            "https://player.vimeo.com/video/1065493306?autoplay=1&dnt=1&background=1",
            "https://en.wikipedia.org/w/index.php?title=List_of_circulating_currencies&oldid=1275996218#:~:text=There%20are%20180%20currencies",
            "https://player.vimeo.com/video/885736465?autoplay=1&dnt=1&background=1",
            "https://player.vimeo.com/video/1065496020?autoplay=1&dnt=1&background=1",
          ]
        : [],
    )
    links.forEach((link) => {
      const { httpCode, redirectUrl } = checkLink(link)
      if (httpCode !== "200") {
        console.log(`  ❌ ${link} ${httpCode} ${redirectUrl}`)
        fails.push({ link, httpCode, redirectUrl })
      } else {
        console.log(`  ✅ ${link}`)
      }
    })

    if (
      expectedFails.length === fails.length &&
      fails
        .map((fail) => fail.link)
        .every((link) => expectedFails.includes(link))
    ) {
      console.log(
        `\n✅ Found ${expectedFails.length} expected fails. Total links checked: ${links.size}. `,
      )
      process.exit(0)
    } else {
      console.log(`\n❌ Found ${fails.length} failed links:`)
      fails.forEach((fail, index) => {
        console.log(
          `  ${index + 1}. ${expectedFails.includes(fail.link) ? "" : "(UNEXPECTED)"} ${fail.link} ${fail.httpCode} ${fail.redirectUrl}`,
        )
      })
      process.exit(1)
    }
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

setup()
main()
