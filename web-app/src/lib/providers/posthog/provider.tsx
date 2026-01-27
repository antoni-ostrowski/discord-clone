import { env } from "@/env"
import { PostHogProvider } from "@posthog/react"
import posthog from "posthog-js"
import { useEffect, useState } from "react"

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    posthog.init(env.VITE_PUBLIC_POSTHOG_KEY, {
      api_host: env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: "2025-11-30"
    })

    setHydrated(true)
  }, [])

  if (!hydrated) return <>{children}</>
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
