import { env } from "@/env"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"
import { QueryClient } from "@tanstack/react-query"
import {
  inferAdditionalFields,
  organizationClient
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { createAuthMutations } from "better-convex/react"
import { Auth } from "../../convex/functions/auth"

export const authClient = createAuthClient({
  baseURL: env.VITE_SITE_URL,
  plugins: [inferAdditionalFields<Auth>(), organizationClient(), convexClient()]
})

export const {
  useSignInMutationOptions,
  useSignInSocialMutationOptions,
  useSignOutMutationOptions,
  useSignUpMutationOptions
} = createAuthMutations(authClient)

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction
} = convexBetterAuthReactStart({
  convexUrl: env.VITE_CONVEX_URL,
  convexSiteUrl: env.VITE_CONVEX_SITE_URL
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

export const getClientAuth = async (qc: QueryClient) => {
  const session = await qc.fetchQuery({
    queryKey: ["client-auth"],
    queryFn: () => authClient.getSession()
  })

  return {
    isAuthenticated: !!session.data?.user,
    user: session.data?.user
  }
}

export const getServerAuth = async () => {
  const token = await getToken()
  return { isAuthenticated: !!token }
}
