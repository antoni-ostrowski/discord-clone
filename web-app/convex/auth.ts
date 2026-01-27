import {
  AuthFunctions,
  createClient,
  type GenericCtx
} from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { checkout, polar, portal } from "@polar-sh/better-auth"
import { Polar } from "@polar-sh/sdk"
import { betterAuth, BetterAuthOptions } from "better-auth"
import { components, internal } from "./_generated/api"
import { DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"
import authSchema from "./betterAuth/schema"
import { getAuthAsync } from "./lib"

const siteUrl = process.env.SITE_URL

const authFunctions: AuthFunctions = internal.auth

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox"
})

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
    user: {
      deleteUser: {
        enabled: true,
        afterDelete: async (user, _request) => {
          await polarClient.customers.deleteExternal({
            externalId: user.id
          })
        }
      }
    },
    plugins: [
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
          checkout({
            theme: "dark",
            // put your product ids here
            products: [
              {
                productId: "24629f61-995d-4a9d-b1bb-7b060fb5327a",
                slug: "test-product" // Custom slug for easy reference in Checkout URL, e.g. /checkout/test-product
              }
            ],
            successUrl: process.env.POLAR_SUCCESS_URL,
            authenticatedUsersOnly: true,
            returnUrl: process.env.SITE_URL
          }),
          portal({
            returnUrl: process.env.SITE_URL
          })
        ]
      }),
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
