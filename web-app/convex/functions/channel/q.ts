import { asyncMap } from "convex-helpers"
import { Effect } from "effect"
import z from "zod"
import { authQuery } from "../../lib/crpc"
import {
  DatabaseError,
  effectifyPromise,
  runEffOrThrow,
  ServerError
} from "../../lib/lib"
import { appRuntime } from "../../lib/runtime"
import { channelZod, userZod } from "../schema"

export const list = authQuery
  .output(
    z.array(
      z.object({
        members: z.array(userZod),
        channel: channelZod,
        isCurrentUserMember: z.boolean()
      })
    )
  )
  .query(async ({ ctx }) => {
    const program = Effect.gen(function* () {
      const serverId = ctx.user.lastActiveOrganizationId
      if (!serverId) {
        return yield* new ServerError({})
      }
      const channelEnts = yield* effectifyPromise(
        () =>
          ctx.table("channel", "serverId", (q) => q.eq("serverId", serverId)),
        (cause, message) => new DatabaseError({ cause, message })
      )

      const data = yield* effectifyPromise(
        () =>
          asyncMap(channelEnts, async (channelEnt) => {
            const members = await channelEnt.edge("members").docs()
            const channel = channelEnt.doc()
            const isCurrentUserMember = !!members.find(
              (a) => a._id === ctx.userId
            )
            return { members, channel, isCurrentUserMember }
          }),
        (cause, message) => new DatabaseError({ cause, message })
      )

      return data
    })
    return await runEffOrThrow(appRuntime, program)
  })
