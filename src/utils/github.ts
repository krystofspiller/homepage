import { z } from "astro:content"
import { env } from "env"

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

  return result.data
}

/**
 * Fetches the content of a file at a specific commit
 */
export async function getFileContentAtCommit(
  filePath: string,
  sha: string,
): Promise<string | null> {
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
    return atob(data.data.content)
  }

  return data.success ? data.data.content : null
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
