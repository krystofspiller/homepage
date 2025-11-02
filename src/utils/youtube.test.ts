import { YOUTUBE_VIDEO_ID_DEFAULT } from "./constants"
import { getLatestYouTubeVideo } from "./youtube"
import { server } from "@mocks/node"
import { http, passthrough } from "msw"

describe("YouTube API", () => {
  it("should fetch latest YouTube video", async () => {
    server.use(http.get("https://www.googleapis.com/youtube/*", passthrough))

    const videoId = await getLatestYouTubeVideo()
    expect(videoId).not.toBe(YOUTUBE_VIDEO_ID_DEFAULT)
    expect(typeof videoId).toBe("string")
    expect(videoId).toHaveLength(YOUTUBE_VIDEO_ID_DEFAULT.length)
  })
})
