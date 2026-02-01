import { Effect } from "effect"
import { authQuery } from "../../lib/crpc"
import {
  DatabaseError,
  effectifyPromise,
  NotFoundError,
  runEffOrThrow
} from "../../lib/lib"
import { appRuntime } from "../../lib/runtime"
import { channelZod } from "../schema"

export const getCurrentChannel = authQuery
  .output(channelZod)
  .query(async ({ ctx }) => {
    const program = Effect.gen(function* () {
      const curChnId = ctx.user.currentChannelId
      if (!curChnId) {
        return yield* new NotFoundError()
      }
      return yield* effectifyPromise(
        () => ctx.table("channel").getX(curChnId).doc(),
        (cause, message) => new DatabaseError({ cause, message })
      )
    })
    return await runEffOrThrow(appRuntime, program)
  })
