import { useEffect, useRef, useState } from "react"

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
