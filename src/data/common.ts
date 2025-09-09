import { getCollection } from "astro:content"

import { env } from "../../env"

export const posts = await getCollection("blog", ({ data }) => {
  console.log("env.PROD", env.PROD)
  return env.PROD ? !data.draft : true
})
