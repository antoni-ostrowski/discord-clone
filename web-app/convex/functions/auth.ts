import { convex } from "@convex-dev/better-auth/plugins"
import { ac, roles } from "@convex/auth-shared"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { organization } from "better-auth/plugins"
import { createApi, createClient, type AuthFunctions } from "better-convex/auth"
import { internal } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server"
import authConfig from "./auth.config"
import { createPersonalOrganization } from "./organization"
import schema from "./schema"

type GenericCtx = QueryCtx | MutationCtx | ActionCtx
const authFunctions: AuthFunctions = internal.auth

export type Auth = ReturnType<typeof createAuth>
// Create client with Convex adapter and triggers
export const authClient = createClient<DataModel, typeof schema>({
  authFunctions,
  schema,
  triggers: {
    user: {
      onCreate: async (ctx, user) => {
        // Create personal organization for the new user
        await createPersonalOrganization(ctx, {
          email: user.email,
          image: user.image || null,
          name: user.name,
          userId: user._id
        })
      }
    }
  }
})

// Auth options factory
export const createAuthOptions = (ctx: GenericCtx) =>
  ({
    baseURL: process.env.SITE_URL ?? "http://localhost:3000",
    database: authClient.httpAdapter(ctx),
    plugins: [
      convex({
        authConfig,
        jwks: process.env.JWKS
      }),
      organization({
        allowUserToCreateOrganization: true,
        organizationLimit: 5,
        membershipLimit: 100,
        creatorRole: "owner",
        invitationExpiresIn: 48 * 60 * 60, // 48 hours
        ac,
        roles
      })
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 15 // 15 days
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
      }
    },
    trustedOrigins: [process.env.SITE_URL ?? "http://localhost:3000"]
  }) satisfies BetterAuthOptions

// Create auth instance for HTTP routes
export const createAuth = (ctx: GenericCtx) =>
  betterAuth(createAuthOptions(ctx))

// IMPORTANT: Use getAuth for queries/mutations (direct DB access)
export const getAuth = <Ctx extends QueryCtx | MutationCtx>(ctx: Ctx) => {
  return betterAuth({
    ...createAuthOptions(ctx),
    database: authClient.adapter(ctx, createAuthOptions)
  })
}

// Export trigger handlers for Convex
export const {
  beforeCreate,
  beforeDelete,
  beforeUpdate,
  onCreate,
  onDelete,
  onUpdate
} = authClient.triggersApi()

// Export CRUD functions for Better Auth
export const {
  create,
  deleteMany,
  deleteOne,
  findMany,
  findOne,
  updateMany,
  updateOne,
  getLatestJwks,
  rotateKeys
} = createApi(schema, createAuth, {
  skipValidation: true // Smaller generated types
})

export const auth = betterAuth(createAuthOptions({} as any)) // oxlint-disable-line
