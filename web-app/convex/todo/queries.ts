import { Effect } from "effect"
import { query } from "../_generated/server"
import { appRuntime } from "../runtime"
import { runEffOrThrow } from "../utils_effect"
import { TodoApi } from "./api"

export const list = query({
  handler: async ({ db }) => {
    const program = Effect.gen(function* () {
      const todoApi = yield* TodoApi
      return yield* todoApi.listTodos({ db })
    }).pipe(
      Effect.tapError((err) => Effect.logError(err)),
      Effect.tap((a) => Effect.logInfo(a))
    )

    return runEffOrThrow(appRuntime, program)
  }
})
