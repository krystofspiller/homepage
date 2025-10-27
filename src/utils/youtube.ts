import { YOUTUBE_VIDEO_ID_DEFAULT } from "./constants"
import { env } from "env"
import { z } from "zod"

const youtubeVideosSchema = z.object({
  items: z.array(
    z.object({
      contentDetails: z.object({
        videoId: z.string(),
        videoPublishedAt: z.string(),
      }),
    }),
  ),
})

export const getLatestYouTubeVideo = async (): Promise<string> => {
  try {
    const youtubeVideosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=PL7-fKc8SwbfOk3eZyIk_sbKjR7YMO6lfW&key=${env.YOUTUBE_API_KEY}`
    const response = await fetch(youtubeVideosUrl)
    if (!response.ok) {
      // oxlint-disable-next-line no-console
      console.error("Error fetching latest YouTube video:", response.statusText)
      return YOUTUBE_VIDEO_ID_DEFAULT
    }

    const json = await response.json()
    const { items } = youtubeVideosSchema.parse(json)
    let acc: [string, number] = ["id", 0]
    for (const item of items) {
      const date = Date.parse(item.contentDetails.videoPublishedAt)
      if (date > acc[1]) {
        acc = [item.contentDetails.videoId, date]
      }
    }

    return acc[0]
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error("Error fetching latest YouTube video:", error)
    return YOUTUBE_VIDEO_ID_DEFAULT
  }
}
