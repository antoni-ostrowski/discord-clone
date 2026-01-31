import { getHeaders, getSession } from "better-convex/auth"
import { CRPCError, initCRPC } from "better-convex/server"
import type { DataModel } from "../functions/_generated/dataModel"
import type {
  ActionCtx,
  MutationCtx,
  QueryCtx
} from "../functions/_generated/server"
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query
} from "../functions/_generated/server"
import { getAuth } from "../functions/auth"
import { getCtxWithTable } from "./ents"

export type GenericCtx = QueryCtx | MutationCtx | ActionCtx

const c = initCRPC
  .dataModel<DataModel>()
  .context({
    query: (ctx) => getCtxWithTable(ctx),
    mutation: (ctx) => getCtxWithTable(ctx)
  })
  .create({
    query,
    internalQuery,
    mutation,
    internalMutation,
    action,
    internalAction
  })

export const publicQuery = c.query
export const publicMutation = c.mutation
export const privateQuery = c.query.internal()
export const privateMutation = c.mutation.internal()
export const privateAction = c.action.internal()
export const router = c.router

const timingMiddleware = c.middleware(async ({ ctx, next }) => {
  const start = Date.now()
  const result = await next({ ctx })
  console.log(`Request took ${Date.now() - start}ms`)
  return result
})

const authMiddleware = c.middleware(async ({ ctx, next }) => {
  const session = await getSession(ctx)
  if (!session) {
    throw new CRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
  }

  const user = await ctx.table("user").getX(session.userId)

  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        ...getAuth(ctx),
        headers: await getHeaders(ctx, session)
      },
      user: { id: user._id, session, ...user.doc() },
      userId: user._id
    }
  })
})

export const authQuery = c.query.use(timingMiddleware).use(authMiddleware)

export const authMutation = c.mutation.use(timingMiddleware).use(authMiddleware)

export const authAction = c.action.use(timingMiddleware).use(authMiddleware)
