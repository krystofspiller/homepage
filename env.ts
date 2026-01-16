import { createEnv } from "@t3-oss/env-core"
import { YOUTUBE_API_KEY_LENGTH } from "./src/utils/constants"
import { config } from "dotenv"
import { z } from "zod"

const isTest = ["test", "ci"].includes(process.env.ENV ?? "")
const isDev = process.env.ENV === "development"

const getGithubToken = (): z.ZodDefault<z.ZodString> | z.ZodString => {
  if (isTest) {
    return z.string().default("test-key")
  }

  if (isDev) {
    return z
      .string()
      .regex(
        /^ghp_[a-zA-Z0-9]{36}$/,
        "GitHub Personal Access Token must start with 'ghp_' and be 40 characters long",
      )
  }

  return z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "JWT token must contain only letters, numbers, underscores and hyphens",
    )
}

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
    GITHUB_TOKEN: getGithubToken(),
    YOUTUBE_API_KEY: isTest
      ? z.string().default("test-key")
      : z.string().length(YOUTUBE_API_KEY_LENGTH),
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
