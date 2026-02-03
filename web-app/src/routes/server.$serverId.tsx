import PageWrapper from "@/components/shared/page-wrapper"
import { useSession } from "@/lib/auth-client"
import { useCRPC } from "@/lib/convex/cprc"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { JoinLeaveChannel } from "./-server-components/join-leave-channel-btn"

export const Route = createFileRoute("/server/$serverId")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const crpc = useCRPC()
  const { user } = useSession()
  const { data, error } = useQuery(crpc.user.q.getCurrentChannel.queryOptions())
  if (!user) {
    return null
  }
  console.log({ data })
  return (
    <PageWrapper>
      <div>
        {data && !error ? (
          <div>
            you talk on this channel: {data.name}{" "}
            <WebRTCClient {...{ userId: user.id, channelId: data._id }} />
            <JoinLeaveChannel
              {...{ channelId: data._id, isCurrentUserMember: true }}
            />
          </div>
        ) : (
          <div>you are not in any vs channel</div>
        )}
      </div>
      <Outlet />
    </PageWrapper>
  )
}

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

export default function WebRTCClient({
  channelId,
  userId
}: {
  channelId: string
  userId: string
}) {
  const [status, setStatus] = useState("Initializing...")
  const [localVolume, setLocalVolume] = useState(0)
  const [remoteVolume, setRemoteVolume] = useState(0)
  const [remoteTracks, setRemoteTracks] = useState<number>(0)
  const [statsInfo, setStatsInfo] = useState({
    bytesSent: 0,
    bytesReceived: 0,
    packetsLost: 0
  })

  const pc = useRef<RTCPeerConnection | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const remoteDescriptionSet = useRef(false)
  const pendingRemoteCandidates = useRef<RTCIceCandidateInit[]>([])
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRefs = useRef<HTMLAudioElement[]>([])
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    let mounted = true
    console.log("🚀 Effect starting for", userId)

    // 1. Initialize PeerConnection
    pc.current = new RTCPeerConnection(ICE_CONFIG)
    setStatus("Connecting...")

    // 2. Handle incoming remote tracks
    // 2. Handle incoming remote tracks
    pc.current.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track])
      console.log(
        "🎉🎉🎉 Remote track received:",
        event.track.kind,
        event.track.id
      )
      console.log("Stream ID:", stream.id)
      console.log("Track enabled:", event.track.enabled)
      console.log("Track muted:", event.track.muted)
      console.log("Track readyState:", event.track.readyState)

      const remoteAudio = new Audio()
      remoteAudio.srcObject = stream
      remoteAudio.autoplay = true

      // CRITICAL: Set volume to max
      remoteAudio.volume = 1.0

      remoteAudio
        .play()
        .then(() => {
          console.log("Remote audio playing successfully")
        })
        .catch((err) => {
          console.error("Failed to play remote audio:", err)
          // Try playing after user interaction
          document.addEventListener(
            "click",
            () => {
              remoteAudio.play()
            },
            { once: true }
          )
        })

      remoteAudioRefs.current.push(remoteAudio)
      setRemoteTracks((prev) => prev + 1)

      // Monitor remote audio volume
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(event.streams[0])
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkRemoteVolume = () => {
        if (!mounted) return
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setRemoteVolume(Math.round(average))
        requestAnimationFrame(checkRemoteVolume)
      }
      checkRemoteVolume()
    }

    // 3. Connection state monitoring
    pc.current.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", pc.current?.connectionState)
      setStatus(`Connection: ${pc.current?.connectionState}`)
    }

    pc.current.oniceconnectionstatechange = () => {
      console.log("🧊 ICE state:", pc.current?.iceConnectionState)
    }

    // 4. Handle local ICE candidates
    pc.current.onicecandidate = (event) => {
      if (!event.candidate) {
        console.log("🧊 ICE gathering complete")
        return
      }

      const msg = {
        type: "candidate",
        payload: event.candidate
      }

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(msg))
      }
    }

    // 5. Request Mic Access
    console.log("🎤 Requesting microphone access...")
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!mounted) return

        console.log("🎤 Microphone access granted")
        localStreamRef.current = stream

        // Monitor local microphone volume
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkLocalVolume = () => {
          if (!mounted) return
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setLocalVolume(Math.round(average))
          animationFrameRef.current = requestAnimationFrame(checkLocalVolume)
        }
        checkLocalVolume()

        stream.getTracks().forEach((track) => {
          console.log(
            "🎤 Adding track to peer connection:",
            track.id,
            track.label
          )
          pc.current?.addTrack(track, stream)
        })
        setStatus("Mic ready - creating offer...")

        // CLIENT CREATES THE OFFER
        const createAndSendOffer = async () => {
          if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            setTimeout(createAndSendOffer, 50)
            return
          }

          try {
            console.log("📤 Creating offer...")
            const offer = await pc.current!.createOffer()
            await pc.current!.setLocalDescription(offer)
            console.log("📤 Sending offer to server")
            ws.current.send(
              JSON.stringify({
                type: "offer",
                payload: offer.sdp
              })
            )
            setStatus("Offer sent - waiting for answer...")
          } catch (err) {
            console.error("❌ Error creating offer:", err)
          }
        }

        createAndSendOffer()
      })
      .catch((err) => {
        console.error("❌ Mic access denied:", err)
        setStatus("Error: Mic access denied")
      })

    // 6. Connect WebSocket
    const wsUrl = `ws://localhost:8080/channel?channelId=${channelId}&userId=${userId}`
    console.log("🔌 Connecting WebSocket to:", wsUrl)
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
      if (!mounted) return
      console.log("🔌 WebSocket OPENED")
    }

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error)
      setStatus("Connection error")
    }

    socket.onclose = (event) => {
      console.log("🔌 WebSocket closed:", event.code, event.reason)
      if (mounted) {
        setStatus("Disconnected")
      }
    }

    socket.onmessage = async (e) => {
      const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data

      console.log("📨 Message received:", msg.type)
      await handleSignal(msg)
    }

    // Unified signal handler
    const handleSignal = async (msg: unknown) => {
      if (typeof msg !== "object" || msg === null) return
      const { type, payload } = msg as { type: string; payload: unknown }
      const peer = pc.current
      if (!peer) return

      try {
        if (type === "answer") {
          console.log("📨 Received answer from server")
          await peer.setRemoteDescription({
            type: "answer",
            sdp: payload as string
          })
          console.log("✅ Remote description (answer) set")
          remoteDescriptionSet.current = true
          setStatus("Answer received - connecting...")

          // Process queued ICE candidates
          console.log(
            `📦 Processing ${pendingRemoteCandidates.current.length} queued ICE candidates`
          )
          while (pendingRemoteCandidates.current.length > 0) {
            const candidate = pendingRemoteCandidates.current.shift()!
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (err) {
              console.error("❌ Error adding queued candidate:", err)
            }
          }
        } else if (type === "candidate") {
          const candidateInit = payload as RTCIceCandidateInit

          if (!remoteDescriptionSet.current) {
            console.log("⏳ Queuing ICE candidate")
            pendingRemoteCandidates.current.push(candidateInit)
          } else {
            console.log("🧊 Adding remote ICE candidate")
            await peer.addIceCandidate(new RTCIceCandidate(candidateInit))
          }
        } else if (type === "offer") {
          console.log("📨 Received offer from server (renegotiation)")
          await peer.setRemoteDescription({
            type: "offer",
            sdp: payload as string
          })
          console.log("✅ Remote description (offer) set")
          remoteDescriptionSet.current = true

          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          console.log("📤 Sending answer to server")
          ws.current?.send(
            JSON.stringify({ type: "answer", payload: answer.sdp })
          )
        }
      } catch (err) {
        console.error("❌ Signal handling error:", err)
      }
    }

    // Stats monitoring
    const statsInterval = setInterval(async () => {
      if (!pc.current) return

      try {
        const stats = await pc.current.getStats()
        let bytesSent = 0
        let bytesReceived = 0
        let packetsLost = 0

        stats.forEach((report) => {
          if (report.type === "outbound-rtp") {
            bytesSent += report.bytesSent || 0
          }
          if (report.type === "inbound-rtp") {
            bytesReceived += report.bytesReceived || 0
            packetsLost += report.packetsLost || 0
          }
        })

        setStatsInfo({ bytesSent, bytesReceived, packetsLost })
      } catch (err) {
        console.error("Error getting stats:", err)
      }
    }, 1000)

    // Cleanup function
    return () => {
      mounted = false
      console.log("🧹 Cleanup - closing connections for", userId)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      clearInterval(statsInterval)

      remoteAudioRefs.current.forEach((audio) => {
        audio.pause()
        audio.srcObject = null
      })

      localStreamRef.current?.getTracks().forEach((track) => track.stop())

      socket.close()
      pc.current?.close()
    }
  }, [channelId, userId])

  // Visual volume bar component
  const VolumeBar = ({
    volume,
    label,
    color
  }: {
    volume: number
    label: string
    color: string
  }) => (
    <div style={{ marginBottom: "15px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "5px"
        }}
      >
        <span>{label}</span>
        <span>{volume}</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "20px",
          backgroundColor: "#e0e0e0",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.min(volume, 100)}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.1s ease-out"
          }}
        />
      </div>
    </div>
  )

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        marginTop: "20px",
        maxWidth: "600px"
      }}
    >
      <h3 style={{ marginTop: 0 }}>WebRTC Voice Chat</h3>

      {/* Connection Status */}
      <div
        style={{
          padding: "10px",
          backgroundColor: status.includes("connected") ? "#4caf50" : "#ff9800",
          color: "white",
          borderRadius: "4px",
          marginBottom: "20px",
          fontSize: "14px"
        }}
      >
        Status: {status}
      </div>

      {/* Audio Levels */}
      <div
        style={{
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}
      >
        <h4 style={{ marginTop: 0 }}>Audio Levels</h4>
        <VolumeBar
          volume={localVolume}
          label="🎤 Your Microphone"
          color="#2196F3"
        />
        <VolumeBar
          volume={remoteVolume}
          label="🔊 Incoming Audio"
          color="#4CAF50"
        />
      </div>

      {/* Connection Info */}
      <div
        style={{
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
          fontSize: "13px"
        }}
      >
        <h4 style={{ marginTop: 0 }}>Connection Details</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px"
          }}
        >
          <div>
            <strong>Channel:</strong>
            <br />
            <span style={{ fontSize: "11px", color: "#666" }}>
              {channelId.slice(0, 20)}...
            </span>
          </div>
          <div>
            <strong>Remote Tracks:</strong> {remoteTracks}
          </div>
          <div>
            <strong>Bytes Sent:</strong>{" "}
            {(statsInfo.bytesSent / 1024).toFixed(1)} KB
          </div>
          <div>
            <strong>Bytes Received:</strong>{" "}
            {(statsInfo.bytesReceived / 1024).toFixed(1)} KB
          </div>
          <div>
            <strong>Packets Lost:</strong> {statsInfo.packetsLost}
          </div>
        </div>
      </div>

      {/* Debug Tip */}
      {status.includes("connected") && remoteTracks === 0 && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
            fontSize: "13px"
          }}
        >
          ⚠️ Connected but no remote tracks yet. Try opening another tab/window
          and joining the same channel.
        </div>
      )}
    </div>
  )
}
