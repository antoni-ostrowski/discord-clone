import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

export const Route = createFileRoute("/")({
  component: App
})

function App() {
  const { isReady, val, send } = useWs({ url: "ws://localhost:8080/echo" })

  console.log(isReady, val)

  useEffect(() => {
    console.log("new val ", val)
  }, [val])

  return (
    <PageWrapper className={"items-center justify-center"}>
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

export const useWs = ({ url }: { url: string }) => {
  const [isReady, setIsReady] = useState(false)
  const [val, setVal] = useState<string[]>([])

  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket(url)

    socket.onopen = () => {
      setIsReady(true)
      console.log("webs on open")
    }
    socket.onclose = () => {
      setIsReady(false)
      console.log("webs on close")
    }
    socket.onmessage = (event) => setVal((prev) => [...prev, event.data])

    ws.current = socket

    return () => {
      socket.close()
    }
  }, [url])

  return { isReady, val, send: ws.current?.send.bind(ws.current) }
}
