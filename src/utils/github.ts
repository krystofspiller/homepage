import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import { join } from "node:path"

import { z } from "astro:content"
import { env } from "env"

// Cache interface for GitHub API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// File-based cache for GitHub API responses
class GitHubCache {
  private cacheDir: string
  private defaultTTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  constructor() {
    this.cacheDir = join(process.cwd(), ".cache", "github")
    this.ensureCacheDir()
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
    ttl: number = this.defaultTTL,
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

  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getCacheFilePath(key)
      const content = await fs.readFile(filePath, "utf8")
      const entry: CacheEntry<T> = JSON.parse(content)

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
  sha: z.string(),
  commit: z.object({
    author: z.object({
      date: z.string(),
    }),
  }),
})
const githubCommitResponse = z.array(githubCommit)
const githubFileContent = z.object({
  sha: z.string(),
  content: z.string(),
  encoding: z.string(),
})
const blogVersion = z.object({
  sha: z.string(),
  date: z.string(),
})

type GitHubCommit = z.infer<typeof githubCommit>
export type GithubFileContent = z.infer<typeof githubFileContent>
type BlogVersion = z.infer<typeof blogVersion>

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
export async function getFileCommitHistory(
  filePath: string,
): Promise<GitHubCommit[]> {
  const cacheKey = `fileCommitHistory:${filePath}`
  const cachedData = await githubCache.get<GitHubCommit[]>(cacheKey)
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
      `GitHub API error: ${response.status} ${response.statusText}. Headers: ${JSON.stringify(Array.from(response.headers.entries()))}`,
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
export async function getFileContentAtCommit(
  filePath: string,
  sha: string,
): Promise<string | null> {
  const cacheKey = `fileContentAtCommit:${filePath}`
  const cachedData = await githubCache.get<string | null>(cacheKey)
  if (cachedData) {
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
  if (data.success && data.data.encoding === "base64") {
    const res = atob(data.data.content)
    await githubCache.set(cacheKey, res)
    return res
  }

  const res = data.success ? data.data.content : null
  await githubCache.set(cacheKey, res)

  return res
}

/**
 * Gets blog post versions from GitHub commit history
 */
export async function getBlogPostVersions(
  fileName: string,
): Promise<BlogVersion[]> {
  const filePath = `src/data/blog/${fileName}.mdx`
  const commits = await getFileCommitHistory(filePath)

  return commits.map((commit) => ({
    sha: commit.sha,
    date: commit.commit.author.date,
  }))
}

/**
 * Gets the content of a specific version of a blog post
 */
export async function getBlogPostVersionContent(
  fileName: string,
  sha: string,
): Promise<string | null> {
  const filePath = `src/data/blog/${fileName}.mdx`
  return await getFileContentAtCommit(filePath, sha)
}
