import { asyncMap } from "convex-helpers"
import { zid } from "convex-helpers/server/zod4"
import { Effect } from "effect"
import z from "zod"
import { authQuery } from "../../lib/crpc"
import { DatabaseError, effectifyPromise, runEffOrThrow } from "../../lib/lib"
import { appRuntime } from "../../lib/runtime"
import { channelWithMembersZod, orgZod } from "../schema"

export const get = authQuery
  .input(z.object({ serverId: zid("organization") }))
  .output(
    z.object({
      channels: z.array(channelWithMembersZod),
      server: orgZod
    })
  )
  .query(async ({ ctx, input }) => {
    const program = Effect.gen(function* () {
      const server = yield* effectifyPromise(
        () => ctx.table("organization").getX(input.serverId),
        (cause, message) => new DatabaseError({ cause, message })
      )
      const channels = yield* effectifyPromise(
        async () => {
          const channels = await server.edge("channel")
          const data = await asyncMap(channels, async (channel) => {
            const members = await channel.edge("members").docs()
            const channelDoc = channel.doc()
            const isCurrentUserMember = !!members.find(
              (a) => a._id === ctx.userId
            )
            return { channel: channelDoc, members, isCurrentUserMember }
          })
          return data
        },
        (cause, message) => new DatabaseError({ cause, message })
      )
      return { channels, server }
    })
    return await runEffOrThrow(appRuntime, program)
  })
