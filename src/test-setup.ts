import { config } from "dotenv"

// Load environment variables for testing
config({ path: ".env.test", override: true, quiet: true })
