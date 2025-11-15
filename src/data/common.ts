import { getCollection } from "astro:content"

import { env } from "../../env"

const posts = await getCollection("blog", ({ data }) =>
  env.ENV === "production" ? !(data.draft ?? false) : true,
)

const postsVersions = await getCollection("blogVersions", ({ data }) =>
  env.ENV === "production" ? !(data.draft ?? false) : true,
)

const postsIncludingDrafts = await getCollection("blog")

export { posts, postsVersions, postsIncludingDrafts }
