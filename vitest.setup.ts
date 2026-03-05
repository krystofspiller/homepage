// oxlint-disable require-top-level-describe

import { server } from "@mocks/node"

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})
