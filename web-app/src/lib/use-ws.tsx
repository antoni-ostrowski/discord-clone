import { useEffect, useRef, useState } from "react"

export const useWs = ({ url }: { url: string }) => {
  const [isReady, setIsReady] = useState(false)
  const [val, setVal] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket(url)
    socket.onopen = () => setIsReady(true)
    socket.onclose = () => setIsReady(false)
    socket.onmessage = (event) => setVal(event.data)
    ws.current = socket

    return () => {
      // Prevents the "Closed before established" error in Strict Mode
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close()
      }
    }
  }, [url])

  return {
    isReady,
    val,
    // Use a stable callback for sending
    send: (thing: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(thing)
      }
    }
  }
}
