import { zid } from "convex-helpers/server/zod4"
import { Effect } from "effect"
import z from "zod"
import { authMutation } from "../../lib/crpc"
import {
  DatabaseError,
  effectifyPromise,
  runEffOrThrow,
  ServerError
} from "../../lib/lib"
import { appRuntime } from "../../lib/runtime"

export const create = authMutation
  .input(z.object({ name: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const program = Effect.gen(function* () {
      const serverId = ctx.user.lastActiveOrganizationId
      if (!serverId) {
        return yield* new ServerError({})
      }
      return yield* effectifyPromise(
        () =>
          ctx.table("channel").insert({
            name: input.name,
            serverId: serverId
          }),
        ({ cause, message }) => new DatabaseError({ message, cause })
      )
    })
    return await runEffOrThrow(appRuntime, program)
  })

export const joinOrLeave = authMutation
  .input(
    z.object({
      channelId: zid("channel"),
      action: z.union([z.literal("join"), z.literal("leave")])
    })
  )
  .mutation(async ({ ctx, input }) => {
    const isJoin = input.action === "join"
    const program = Effect.gen(function* () {
      yield* effectifyPromise(
        () =>
          ctx
            .table("channel")
            .getX(input.channelId)
            .patch({
              members: isJoin ? { add: [ctx.userId] } : { remove: [ctx.userId] }
            }),

        (cause, message) => new DatabaseError({ cause, message })
      )

      yield* effectifyPromise(
        () =>
          ctx
            .table("user")
            .getX(ctx.userId)
            .patch({ currentChannelId: isJoin ? input.channelId : undefined }),
        (cause, message) => new DatabaseError({ cause, message })
      )
    })
    return await runEffOrThrow(appRuntime, program)
  })

export const remove = authMutation
  .input(z.object({ channelId: zid("channel") }))
  .mutation(async ({ ctx, input }) => {
    const program = Effect.gen(function* () {
      return yield* effectifyPromise(
        () => ctx.table("channel").getX(input.channelId).delete(),
        ({ cause, message }) => new DatabaseError({ message, cause })
      )
    })
    return await runEffOrThrow(appRuntime, program)
  })
