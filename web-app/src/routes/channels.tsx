import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCRPC } from "@/lib/convex/cprc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/channels")({
  component: RouteComponent
})

function RouteComponent() {
  const crpc = useCRPC()
  const [input, setInput] = useState("")
  const { data } = useQuery(crpc.channel.q.list.queryOptions())
  const { mutate: createChannel } = useMutation(
    crpc.channel.m.create.mutationOptions()
  )

  const { mutate: joinOrLeaveChannel } = useMutation(
    crpc.channel.m.joinOrLeave.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "loading..."
      }
    })
  )
  const { data: currentChannel } = useQuery(
    crpc.user.q.getCurrentChannel.queryOptions()
  )

  const { mutate: deleteChannel } = useMutation(
    crpc.channel.m.remove.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "removing..."
      }
    })
  )

  return (
    <PageWrapper className="h-screen gap-10">
      <div>current channel query : {currentChannel?.name}</div>
      <p>adding channels to active org/server</p>
      {data?.map((channel) => (
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
    </PageWrapper>
  )
}
