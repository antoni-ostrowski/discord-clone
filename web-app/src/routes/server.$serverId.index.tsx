import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCRPC } from "@/lib/convex/cprc"
import { Id } from "@convex/dataModel"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/server/$serverId/")({
  component: RouteComponent
})

function RouteComponent() {
  const { serverId } = Route.useParams()
  const crpc = useCRPC()
  const {
    data: serverData,
    isPending,
    error
  } = useQuery(
    crpc.server.q.get.queryOptions({ serverId: serverId as Id<"organization"> })
  )

  const { mutate: joinOrLeaveChannel } = useMutation(
    crpc.channel.m.joinOrLeave.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "loading..."
      }
    })
  )

  const { mutate: deleteChannel } = useMutation(
    crpc.channel.m.remove.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "removing..."
      }
    })
  )

  const { mutate: createChannel } = useMutation(
    crpc.channel.m.create.mutationOptions()
  )
  const [input, setInput] = useState("")

  if (isPending) return <div>pending</div>
  if (error) return <div>{error.message}</div>

  return (
    <PageWrapper>
      create channel:
      <div className="flex flex-row gap-2">
        <Input
          className="w-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={() => createChannel({ name: input })}>
          create channel
        </Button>
      </div>
      Hello {serverData.server.name} server
      <div>
        {serverData.channels.map((channel) => (
          <div key={channel.channel._id}>
            channel : {channel.channel.name}
            {channel.members.map((member) => (
              <li key={`member-${member._id}-${channel.channel._id}`}>
                member : {member.name}
              </li>
            ))}
            <Button
              variant={"destructive"}
              onClick={() => deleteChannel({ channelId: channel.channel._id })}
            >
              remove
            </Button>
            {channel.isCurrentUserMember ? (
              <Button
                onClick={() =>
                  joinOrLeaveChannel({
                    channelId: channel.channel._id,
                    action: "leave"
                  })
                }
              >
                leave channel
              </Button>
            ) : (
              <Button
                onClick={() =>
                  joinOrLeaveChannel({
                    channelId: channel.channel._id,
                    action: "join"
                  })
                }
              >
                join channel
              </Button>
            )}
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
