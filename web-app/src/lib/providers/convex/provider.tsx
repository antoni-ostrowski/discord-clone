import { env } from "@/env"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { ConvexProvider } from "convex/react"

if (!env.VITE_CONVEX_URL) {
  console.error("missing envar CONVEX_URL")
}
const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL)

export default function AppConvexProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  )
}
