import { getCollection } from "astro:content"

import { env } from "../../env"

export const posts = await getCollection("blog", ({ data }) => {
  return env.ENV === "production" ? !data.draft : true
})

export const postsVersions = await getCollection("blogVersions", ({ data }) => {
  return env.ENV === "production" ? !data.draft : true
})

export const postsIncludingDrafts = await getCollection("blog")
