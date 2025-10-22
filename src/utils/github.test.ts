import { beforeEach, describe, it, expect, vi } from "vitest"

// Mock fetch before importing the module
global.fetch = vi.fn()

// Mock the file system to prevent cache persistence
vi.mock("node:fs", () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn().mockRejectedValue(new Error("File not found")),
    unlink: vi.fn(),
  },
}))

import {
  getBlogPostVersions,
  getBlogPostVersionContent,
  type GithubFileContent,
} from "./github"

describe("GitHub API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch blog post versions", async () => {
    const mockCommits = [
      {
        sha: "abc123",
        commit: {
          author: {
            date: "2024-01-01T12:00:00Z",
          },
        },
      },
      {
        sha: "def456",
        commit: {
          author: {
            date: "2024-01-01T10:00:00Z",
          },
        },
      },
    ]

    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommits,
    })

    const versions = await getBlogPostVersions("test-post")

    expect(versions).toHaveLength(2)
    expect(versions[0]).toEqual({
      sha: "abc123",
      date: "2024-01-01T12:00:00Z",
    })
    expect(versions[1]).toEqual({
      sha: "def456",
      date: "2024-01-01T10:00:00Z",
    })
  })

  it("should handle API errors gracefully", async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: new Headers(),
    })

    await expect(getBlogPostVersions("nonexistent-post")).rejects.toThrow(
      "GitHub API error: 404 Not Found",
    )
  })

  it("should fetch file content at specific commit", async () => {
    const mockContent: GithubFileContent = {
      sha: "abc123",
      content: btoa("---\ntitle: Test\n---\n\n# Hello World"),
      encoding: "base64",
    }

    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContent,
    })

    const content = await getBlogPostVersionContent(
      "test-post",
      mockContent.sha,
    )

    expect(content).toBe("---\ntitle: Test\n---\n\n# Hello World")
  })
})
