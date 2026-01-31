import { api } from "@convex/api"
import { meta } from "@convex/meta"
import { createCRPCContext } from "better-convex/react"

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext<
  typeof api
>({
  api,
  meta,
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL
})
