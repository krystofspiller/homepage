import { createHash } from "node:crypto"
import { env } from "env"
import { promises as fs } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { DEFAULT_CACHE_TTL } from "./constants"

// Cache interface for GitHub API responses
const cacheEntrySchema = <T>(
  schema: z.ZodType<T>,
): z.ZodObject<{
  data: z.ZodType<T>
  timestamp: z.ZodNumber
  ttl: z.ZodNumber
}> =>
  z.object({
    data: schema,
    timestamp: z.number(),
    ttl: z.number(),
  })
type CacheEntry<T> = z.infer<ReturnType<typeof cacheEntrySchema<T>>>

// File-based cache for GitHub API responses
class GitHubCache {
  private cacheDir: string

  constructor() {
    this.cacheDir = join(process.cwd(), ".cache", "github")
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch {
      // Cache directory creation failed, will be handled gracefully
    }
  }

  private getCacheFilePath(key: string): string {
    // Create a safe filename from the key using hash
    const hash = createHash("md5").update(key).digest("hex")
    return join(this.cacheDir, `${hash}.json`)
  }

  async set<T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_CACHE_TTL,
  ): Promise<void> {
    try {
      await this.ensureCacheDir()
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      }
      const filePath = this.getCacheFilePath(key)
      await fs.writeFile(filePath, JSON.stringify(entry), "utf8")
    } catch {
      // Cache write failed, will be handled gracefully
    }
  }

  async get<T>(key: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const filePath = this.getCacheFilePath(key)
      const content = await fs.readFile(filePath, "utf8")
      const entry = cacheEntrySchema(schema).parse(JSON.parse(content))

      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        // Entry expired, delete the file
        await this.delete(key)
        return null
      }

      return entry.data
    } catch {
      // File doesn't exist or other error, return null
      return null
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key)
      await fs.unlink(filePath)
    } catch {
      // File doesn't exist or other error, ignore
    }
  }
}

const githubCache = new GitHubCache()

const githubCommit = z.object({
  commit: z.object({
    author: z.object({
      date: z.string(),
    }),
  }),
  sha: z.string(),
})
const githubCommitResponse = z.array(githubCommit)
const githubFileContent = z.object({
  content: z.string(),
  encoding: z.string(),
  sha: z.string(),
})

type GitHubCommit = z.infer<typeof githubCommit>
type GithubFileContent = z.infer<typeof githubFileContent>
interface BlogVersion {
  date: string
  sha: string
}

const GITHUB_API_BASE = "https://api.github.com"
const REPO_OWNER = "krystofspiller"
const REPO_NAME = "homepage"

const headers = {
  Accept: "application/vnd.github.v3+json",
  Authorization: `Bearer ${env.GITHUB_TOKEN}`,
}

/**
 * Fetches commit history for a specific file in the repository
 */
const getFileCommitHistory = async (
  filePath: string,
): Promise<GitHubCommit[]> => {
  const cacheKey = `fileCommitHistory:${filePath}`
  const cachedData = await githubCache.get(cacheKey, githubCommitResponse)
  if (cachedData) {
    return cachedData
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(filePath)}&per_page=10`,
    {
      headers,
    },
  )

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}. Headers: ${JSON.stringify([...response.headers.entries()])}`,
    )
  }

  const result = githubCommitResponse.safeParse(await response.json())
  if (!result.success) {
    throw new Error(result.error.message)
  }

  await githubCache.set(cacheKey, result.data)

  return result.data
}

/**
 * Fetches the content of a file at a specific commit
 */
const getFileContentAtCommit = async (
  filePath: string,
  sha: string,
): Promise<string | null> => {
  const cacheKey = `fileContentAtCommit:${filePath}`
  const cachedData = await githubCache.get(cacheKey, z.string().nullable())
  if (cachedData !== null) {
    return cachedData
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(filePath)}?ref=${sha}`,
    {
      headers,
    },
  )

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    )
  }

  const data = githubFileContent.safeParse(await response.json())
  if (!data.success) {
    return null
  }

  const res =
    data.data.encoding === "base64"
      ? atob(data.data.content)
      : data.data.content
  await githubCache.set(cacheKey, res)
  return res
}

/**
 * Gets blog post versions from GitHub commit history
 */
const getBlogPostVersions = async (
  fileName: string,
): Promise<BlogVersion[]> => {
  const filePath = `src/data/blog/${fileName}.mdx`
  const commits = await getFileCommitHistory(filePath)

  return commits.map((commit) => ({
    date: commit.commit.author.date,
    sha: commit.sha,
  }))
}

/**
 * Gets the content of a specific version of a blog post
 */
const getBlogPostVersionContent = async (
  fileName: string,
  sha: string,
): Promise<string | null> => {
  const filePath = `src/data/blog/${fileName}.mdx`
  try {
    return await getFileContentAtCommit(filePath, sha)
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error(error)
    throw error
  }
}

export { getBlogPostVersionContent, getBlogPostVersions }
export type { GithubFileContent }
