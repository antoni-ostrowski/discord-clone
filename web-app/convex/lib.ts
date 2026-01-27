import { GenericCtx } from "@convex-dev/better-auth"
import { makeUseQueryWithStatus } from "convex-helpers/react"
import { useQueries } from "convex-helpers/react/cache"
import {
  customAction,
  customCtx,
  customMutation,
  customQuery
} from "convex-helpers/server/customFunctions"
import { typedV } from "convex-helpers/validators"
import { ConvexError } from "convex/values"
import { DataModel } from "./_generated/dataModel"
import { action, mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { MyUserId } from "./betterAuth/schema"
import schema from "./schema"
import { getAuthEff, getUserEff } from "./utils_effect"

export const useQuery = makeUseQueryWithStatus(useQueries)
export const vv = typedV(schema)

export async function getAuthAsync(ctx: GenericCtx<DataModel>) {
  return await authComponent.getAuth(createAuth, ctx)
}

export async function getUserAsync(ctx: GenericCtx<DataModel>) {
  return await authComponent.getAuthUser(ctx)
}

async function createAuthCtx(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    throw new ConvexError("Not authenticated")
  }
  return {
    ...ctx,
    auth: {
      ...ctx.auth,
      identity,
      getUserAsync,
      getAuthAsync,
      getAuth: getAuthEff(() => getAuthAsync(ctx)),
      getUser: getUserEff(() => getUserAsync(ctx)),
      userId: identity.subject as MyUserId
    }
  }
}

export type AuthCtxType = Awaited<ReturnType<typeof createAuthCtx>>["auth"]

export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    return await createAuthCtx(ctx)
  })
)

export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    return await createAuthCtx(ctx)
  })
)

export const authAction = customAction(
  action,
  customCtx(async (ctx) => {
    return await createAuthCtx(ctx)
  })
)
