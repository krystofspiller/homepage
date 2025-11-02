import { getBlogPostVersionContent, getBlogPostVersions } from "./github"
import type { GithubFileContent } from "./github"
import { server } from "@mocks/node"
import { http, HttpResponse } from "msw"

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
    server.use(
      http.get(
        "https://api.github.com/repos/krystofspiller/homepage/commits",
        () =>
          HttpResponse.json([
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
          ]),
      ),
    )

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
    server.use(
      http.get(
        "https://api.github.com/repos/krystofspiller/homepage/commits",
        () => HttpResponse.json(null, { status: 404 }),
      ),
    )

    await expect(getBlogPostVersions("nonexistent-post")).rejects.toThrow(
      "GitHub API error: 404 Not Found",
    )
  })

  it("should fetch file content at specific commit", async () => {
    const mockContent: GithubFileContent = {
      content: btoa("---\ntitle: Test\n---\n\n# Hello World"),
      encoding: "base64",
      sha: "abc123",
    }

    server.use(
      http.get(
        "https://api.github.com/repos/krystofspiller/homepage/contents/*",
        () => HttpResponse.json(mockContent),
      ),
    )

    const content = await getBlogPostVersionContent(
      "test-post",
      mockContent.sha,
    )

    expect(content).toBe("---\ntitle: Test\n---\n\n# Hello World")
  })
})
