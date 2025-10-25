import { getBlogPostVersionContent, getBlogPostVersions } from "./github"
import type { GithubFileContent } from "./github"

globalThis.fetch = vi.fn()

// Mock filesystem to prevent caching
vi.mock("node:fs", () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn().mockRejectedValue(new Error("File not found")),
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
}))

describe("GitHub API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch blog post versions", async () => {
    const mockCommits = [
      {
        commit: {
          author: {
            date: "2024-01-01T12:00:00Z",
          },
        },
        sha: "abc123",
      },
      {
        commit: {
          author: {
            date: "2024-01-01T10:00:00Z",
          },
        },
        sha: "def456",
      },
    ]

    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => mockCommits,
      ok: true,
    })

    const versions = await getBlogPostVersions("test-post")

    expect(versions).toHaveLength(2)
    expect(versions[0]).toStrictEqual({
      date: "2024-01-01T12:00:00Z",
      sha: "abc123",
    })
    expect(versions[1]).toStrictEqual({
      date: "2024-01-01T10:00:00Z",
      sha: "def456",
    })
  })

  it("should handle API errors gracefully", async () => {
    // Clear any previous mocks and set up a new one for this test
    vi.clearAllMocks()

    const mockResponse = {
      headers: new Headers(),
      ok: false,
      status: 404,
      statusText: "Not Found",
    }

    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse)

    await expect(getBlogPostVersions("nonexistent-post")).rejects.toThrow(
      "GitHub API error: 404 Not Found",
    )
  })

  it("should fetch file content at specific commit", async () => {
    // Clear any previous mocks and set up a new one for this test
    vi.clearAllMocks()

    const mockContent: GithubFileContent = {
      content: btoa("---\ntitle: Test\n---\n\n# Hello World"),
      encoding: "base64",
      sha: "abc123",
    }

    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => mockContent,
      ok: true,
    })

    const content = await getBlogPostVersionContent(
      "test-post",
      mockContent.sha,
    )

    expect(content).toBe("---\ntitle: Test\n---\n\n# Hello World")
  })
})
