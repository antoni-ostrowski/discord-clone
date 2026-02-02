import { Button } from "@/components/ui/button"
import { useCRPC } from "@/lib/convex/cprc"
import { Id } from "@convex/dataModel"
import { useMutation } from "@tanstack/react-query"

export function JoinLeaveChannel(props: {
  isCurrentUserMember: boolean
  channelId: Id<"channel">
}) {
  const crpc = useCRPC()
  const { mutate: joinOrLeaveChannel } = useMutation(
    crpc.channel.m.joinOrLeave.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "loading..."
      }
    })
  )
  return (
    <>
      {props.isCurrentUserMember ? (
        <Button
          onClick={() =>
            joinOrLeaveChannel({
              channelId: props.channelId,
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
              channelId: props.channelId,
              action: "join"
            })
          }
        >
          join channel
        </Button>
      )}
    </>
  )
}
