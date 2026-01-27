import { v } from "convex/values"
import { Effect } from "effect"
import { api } from "../_generated/api"
import { authMutation } from "../lib"
import { appRuntime } from "../runtime"
import { runEffOrThrow } from "../utils_effect"
import { TodoApi } from "./api"

export const toggle = authMutation({
  args: { id: v.id("todos") },
  handler: async ({ db, scheduler }, { id }) => {
    const program = Effect.gen(function* () {
      const todoApi = yield* TodoApi
      const todo = yield* todoApi.getTodo({ db, todoId: id })
      yield* todoApi.toggleTodo({ db, todo })
    })

    scheduler.runAfter(0, api.analytics.captureEvent, {
      entry: {
        event: "some_event",
        properties: {
          plan: "free"
        },
        type: "capture"
      },
      distinctId: crypto.randomUUID()
    })

    await runEffOrThrow(appRuntime, program)
  }
})

export const create = authMutation({
  args: { text: v.string() },
  handler: async ({ db, auth }, { text }) => {
    const program = Effect.gen(function* () {
      const todoApi = yield* TodoApi
      yield* todoApi.create({ db, text, userId: auth.userId })
    })

    await runEffOrThrow(appRuntime, program)
  }
})

export const remove = authMutation({
  args: { todoId: v.id("todos") },
  handler: async ({ db }, { todoId }) => {
    const program = Effect.gen(function* () {
      const todoApi = yield* TodoApi
      yield* todoApi.remove({ db, todoId })
    })

    await runEffOrThrow(appRuntime, program)
  }
})
