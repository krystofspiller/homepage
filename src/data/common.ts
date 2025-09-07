import { getCollection } from "astro:content"

export const posts = await getCollection("blog", ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true
})
