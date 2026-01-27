import { authClient } from "@/lib/auth-client"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "../ui/button"
import { Spinner } from "../ui/spinner"

export default function SignOutBtn() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const session = authClient.useSession()
  const qc = useQueryClient()

  if (!session.isPending && !session.data?.session) {
    return (
      <Link to={"/sign-in"}>
        <Button variant={"outline"}>Sign in</Button>
      </Link>
    )
  }

  return (
    <Button
      onClick={async () => {
        setIsPending(true)
        await authClient.signOut({
          fetchOptions: {
            onResponse: async () => {
              await router.invalidate()
              await qc.resetQueries({ queryKey: ["auth"] })
              location.reload()
              setIsPending(false)
            }
          }
        })
      }}
      variant={"outline"}
    >
      {isPending ? <Spinner /> : "Sign out"}
    </Button>
  )
}
