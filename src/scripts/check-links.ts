// oxlint-disable no-await-in-loop
// oxlint-disable no-console

import path from "node:path"
import { readFile, readdir } from "node:fs/promises"
import { exec } from "node:child_process"

const CURL_IMAGE = "lwthiker/curl-impersonate:0.6-chrome"
const CURL_SSL_VERIFY_FAILED = 60

const execAsync = async (command: string): Promise<string> => {
  const output = await new Promise<string>((resolve, reject) => {
    exec(command, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
  return output
}

const runCurl = async (
  link: string,
  extraArgs: string[] = [],
): Promise<{
  httpCode: string | undefined
  redirectUrl: string | undefined
  exitCode: number
}> => {
  const extra = extraArgs.length > 0 ? ` ${extraArgs.join(" ")}` : ""
  const command = `docker run --platform linux/amd64 --rm ${CURL_IMAGE} curl_chrome116 --silent --output /dev/null -w "%{http_code};%{redirect_url}"${extra} ${JSON.stringify(link)}`

  const { exitCode, stdout } = await new Promise<{
    exitCode: number
    stdout: string
  }>((resolve) => {
    exec(command, { encoding: "utf8" }, (error, stdout) => {
      let exitCode = 0
      if (error) {
        exitCode = typeof error.code === "number" ? error.code : 1
      }
      resolve({ exitCode, stdout })
    })
  })

  const [httpCode, redirectUrl] = stdout.trim().split(";")
  return { exitCode, httpCode, redirectUrl }
}

const isCi = process.argv[2] === "ci"

const setup = async (): Promise<void> => {
  console.log("Setup - pull curl-impersonate chrome")
  const output = await execAsync(`docker pull ${CURL_IMAGE}`)
  console.log("Docker pull curl-impersonate chrome:\n", output)
}

const vimeoPlayerVideoId = (link: string): string | undefined => {
  const match = /^https:\/\/player\.vimeo\.com\/video\/(?<id>\d+)/.exec(link)
  return match?.groups?.id
}

const checkLink = async (
  link: string,
): Promise<{
  httpCode: string | undefined
  redirectUrl: string | undefined
}> => {
  const videoId = vimeoPlayerVideoId(link)
  // Player embeds 401 to curl; oembed still 200s when the video exists.
  const requestUrl =
    videoId === undefined
      ? link
      : `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`

  const result = await runCurl(requestUrl)

  // Stale CA bundle in curl-impersonate 0.6 can fail TLS (curl 60).
  // Retry without verification so we still record the real HTTP status.
  if (result.exitCode === CURL_SSL_VERIFY_FAILED) {
    const insecure = await runCurl(requestUrl, ["-k"])
    if (
      insecure.httpCode !== undefined &&
      insecure.httpCode !== "" &&
      insecure.httpCode !== "000"
    ) {
      return { httpCode: insecure.httpCode, redirectUrl: insecure.redirectUrl }
    }
  }

  if (
    result.exitCode !== 0 &&
    (result.httpCode === undefined ||
      result.httpCode === "" ||
      result.httpCode === "000")
  ) {
    return { httpCode: String(result.exitCode), redirectUrl: result.redirectUrl }
  }

  return { httpCode: result.httpCode, redirectUrl: result.redirectUrl }
}

interface FileInfo {
  path: string
  content: string
  isDirectory: boolean
}

// Function to read and parse .gitignore file
const getGitignorePatterns = async (projectRoot: string): Promise<string[]> => {
  const additionalPatterns = [
    "package-lock.json",
    ".git*",
    ".vscode*",
    "*.gif",
    "*.png",
    "*.avif",
    "*.jpg",
  ]
  try {
    const gitignorePath = path.join(projectRoot, ".gitignore")
    const content = await readFile(gitignorePath, "utf8")

    return [
      ...content
        .split("\n")
        .map((line) => line.trim())
        // Remove empty lines and comments
        .filter((line) => line !== "" && !line.startsWith("#"))
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
      // Remove duplicates
    ].filter((pattern, index, arr) => arr.indexOf(pattern) === index)
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
  const matches = text.match(urlRegex) ?? []

  // Clean up URLs
  return (
    matches
      .map((url) => url.replace(/[.,;?)\]>"'`]+$/, ""))
      // Remove duplicates
      .filter((url, index, arr) => arr.indexOf(url) === index)
      // Remove URLs with variable interpolation
      .filter((url) => !/\${.+}/.test(url))
      // Remove W3C URLs
      .filter((url) => !url.includes("www.w3.org"))
      // Remove localhost URLs
      .filter((url) => !url.includes("localhost"))
      // Remove URLs ending with wildcard (used in tests)
      .filter((url) => !url.endsWith("/*"))
  )
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

      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(baseDir, fullPath)

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
  const expectedFails: [string, string][] = [
    ["999", "https://www.linkedin.com/in/krystof-spiller"],
    ["999", "https://www.linkedin.com/in/maria-muhandes"],
    ["302", "https://player.vimeo.com"],
    ["302", "https://unpkg.com/knip@6/schema.json"],
    ...(isCi
      ? ([
          [
            "999",
            "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
          ],
          [
            "999",
            "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap",
          ],
          [
            "999",
            "https://open.spotify.com/embed/playlist/1i1czz9lUslWTzFr5cHomk?utm_source=generator&theme=0",
          ],
          [
            "999",
            "https://en.wikipedia.org/w/index.php?title=List_of_circulating_currencies&oldid=1275996218#:~:text=There%20are%20180%20currencies",
          ],
        ] satisfies [string, string][])
      : []),
  ]
  for (const link of links) {
    const { httpCode, redirectUrl } = await checkLink(link)
    if (httpCode === "200") {
      console.log(`  ✅ ${link}`)
    } else {
      console.log(`  ❌ ${link} ${httpCode} ${redirectUrl}`)
      fails.push({ httpCode, link, redirectUrl })
    }
  }

  if (
    expectedFails.length >= fails.length &&
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

await setup()
await main()
