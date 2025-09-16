import { getCollection } from "astro:content"

import { env } from "../../env"

export const posts = await getCollection("blog", ({ data }) => {
  return env.PROD ? !data.draft : true
})

export const postsVersions = await getCollection("blogVersions", ({ data }) => {
  return env.PROD ? !data.draft : true
})
