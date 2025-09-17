import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

const isTest = process.env.NODE_ENV === "test"
const isCi = process.env.NODE_ENV === "ci"
const isLoose = isTest || isCi

// Load .env file
config({ quiet: true })

export const env = createEnv({
  server: {
    ENV: z.union([
      z.literal("test"),
      z.literal("ci"),
      z.literal("development"),
      z.literal("production"),
    ]),
    GITHUB_TOKEN: isLoose
      ? z.string().default("test-key")
      : z.string().startsWith("ghp_").min(40).max(40),
    YOUTUBE_API_KEY: isLoose
      ? z.string().default("test-key")
      : z.string().min(39).max(39),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",

  client: {},

  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
