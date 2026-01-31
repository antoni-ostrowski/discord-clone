import { env } from "@/env"
import { api } from "@convex/api"
import { meta } from "@convex/meta"
import { createCallerFactory } from "better-convex/server"

export const { createContext, createCaller } = createCallerFactory({
  api,
  convexSiteUrl: env.VITE_CONVEX_SITE_URL,
  getToken: async (siteUrl: string, headers: Headers) => {
    const token = headers.get("authorization")?.replace("Bearer ", "")
    return { token }
  },
  meta
})
