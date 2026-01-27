import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/sign-in")({
  component: AuthPage
})

function AuthPage() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <Button
        disabled={isPending}
        onClick={async () => {
          setIsPending(true)
          await authClient.signIn.social(
            {
              provider: "github"
            },
            {
              onSuccess: async () => {
                await router.invalidate()
                await router.navigate({ to: "/" })
              },
              onError: (err) => {
                console.error("Failed to sign in - ", err)
                return
              }
            }
          )

          setIsPending(false)
        }}
      >
        {isPending && <Spinner />}
        {"Sign in with Github"}
      </Button>
    </div>
  )
}
