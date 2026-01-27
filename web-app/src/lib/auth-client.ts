import { env } from "@/env"
import { isAuthError } from "@/lib/utils"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"
import { polarClient } from "@polar-sh/better-auth"
import { createServerFn } from "@tanstack/react-start"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: env.VITE_SITE_URL,
  plugins: [polarClient(), convexClient()]
})

// those are necessary utils to fetch convex functions from tanstack server code
export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction
} = convexBetterAuthReactStart({
  convexUrl: env.VITE_CONVEX_URL,
  convexSiteUrl: env.VITE_CONVEX_SITE_URL,
  jwtCache: {
    enabled: true,
    isAuthError
  }
})

/**
 * Gets current user auth session and the query state.
 * (Returns the data pretty much instantly)
 */
export function useSession() {
  const session = authClient.useSession()
  return {
    session: session.data?.session,
    user: session.data?.user,
    query: session
  }
}

/**
 * This is server function to fetch the data from convex using current cookies. It's a default func from convex + better auth docs.
 */
export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken()
})
