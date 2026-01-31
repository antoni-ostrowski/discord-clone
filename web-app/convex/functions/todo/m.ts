import { zid } from "convex-helpers/server/zod4"
import { Effect } from "effect"
import z from "zod"
import { authMutation } from "../../lib/crpc"
import { DatabaseError, effectifyPromise, NotFoundError } from "../../lib/lib"
import { appRuntime } from "../../lib/runtime"

export const toggle = authMutation
  .input(z.object({ id: zid("todo") }))
  .mutation(async ({ ctx, input }) => {
    const program = Effect.gen(function* () {
      const todo = yield* effectifyPromise(
        () => ctx.table("todo").get(input.id),
        (cause, message) => new DatabaseError({ cause, message })
      )

      if (!todo) return yield* new NotFoundError({ message: "todo not found" })

      return yield* effectifyPromise(
        () =>
          ctx
            .table("todo")
            .getX(todo._id)
            .patch({ completed: !todo.completed }),
        (cause, message) => new DatabaseError({ cause, message })
      )
    })
    return await appRuntime.runPromise(program)
  })

export const create = authMutation
  .input(z.object({ text: z.string() }))
  .mutation(async ({ ctx, input: { text } }) => {
    const program = effectifyPromise(
      () =>
        ctx
          .table("todo")
          .insert({ text, completed: false, userId: ctx.user.id }),
      (cause, message) => new DatabaseError({ cause, message })
    )
    return await appRuntime.runPromise(program)
  })

export const remove = authMutation
  .input(z.object({ todoId: zid("todo") }))
  .mutation(async ({ ctx, input: { todoId } }) => {
    const program = effectifyPromise(
      () => ctx.table("todo").getX(todoId).delete(),
      (cause, message) => new DatabaseError({ cause, message })
    )
    return await appRuntime.runPromise(program)
  })
