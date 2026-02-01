import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { useWs } from "@/lib/use-ws"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/ws")({
  component: RouteComponent
})

function RouteComponent() {
  const { user } = useSession()
  const { isReady, val, send } = useWs({
    url: `ws://localhost:8080/channel?channelId=1&userId=${user?.id}`
  })

  console.log(isReady, val)

  useEffect(() => {
    console.log("new val ", val)
  }, [val])

  return (
    <PageWrapper>
      <div className="h-screen">
        <Button
          onClick={() => {
            if (isReady && typeof send === "function") {
              send("jfkdls")
            }
          }}
        >
          send
        </Button>
        Ready: {JSON.stringify(isReady)}
        {val.map((a, index) => (
          <p key={a + index}>
            {index}, {a}
          </p>
        ))}
      </div>
    </PageWrapper>
  )
}
