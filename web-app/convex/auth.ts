import {
  AuthFunctions,
  createClient,
  type GenericCtx
} from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth, BetterAuthOptions } from "better-auth"
import { components, internal } from "./_generated/api"
import { DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"
import authSchema from "./betterAuth/schema"
import { getAuthAsync } from "./lib"

const siteUrl = process.env.SITE_URL

const authFunctions: AuthFunctions = internal.auth

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    logger: {
      disabled: true,
      level: "error"
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string
      }
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true
      })
    ]
  } satisfies BetterAuthOptions
}

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema
    },
    authFunctions
  }
)

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()
export const { getAuthUser } = authComponent.clientApi()

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}

export type AuthType = Awaited<ReturnType<typeof getAuthAsync>>
