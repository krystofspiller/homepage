const DEFAULT_CACHE_TTL = 300_000 // 5 minutes in milliseconds

const GREETING_MESSAGE = [
  `%c
██╗   ██╗ ██╗
██║   ██║ ██║
████████║ ██║
██╔═══██║ ██║
██║   ██║ ██║
╚═╝   ╚═╝ ╚═╝`,
  "color: #e27c0d; font: 400 1em monospace;",
]

const HEADER_HEIGHT = {
  pxNumber: 56,
  tailwindClass: "h-14",
}

const CONTENT_PADDING_WIDTH_PX = 64
const TAILWIND_BREAKPOINTS_IN_PX = {
  "2xl": 1536,
  lg: 1024,
  md: 768,
  sm: 640,
  xl: 1280,
}
const NARROW_CONTENT_WIDTH =
  TAILWIND_BREAKPOINTS_IN_PX.sm - CONTENT_PADDING_WIDTH_PX

const YEARS_OF_EXPERIENCE = Math.abs(
  new Date(Date.now() - new Date(2020, 1, 1).getTime()).getFullYear() - 1970,
)

const YOUTUBE_API_KEY_LENGTH = 39
const YOUTUBE_VIDEO_ID_DEFAULT = "USbc12ZGoZ8"

export {
  DEFAULT_CACHE_TTL,
  GREETING_MESSAGE,
  HEADER_HEIGHT,
  NARROW_CONTENT_WIDTH,
  TAILWIND_BREAKPOINTS_IN_PX,
  YEARS_OF_EXPERIENCE,
  YOUTUBE_API_KEY_LENGTH,
  YOUTUBE_VIDEO_ID_DEFAULT,
}
