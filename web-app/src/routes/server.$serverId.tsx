import PageWrapper from "@/components/shared/page-wrapper"
import { useCRPC } from "@/lib/convex/cprc"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/server/$serverId")({
  component: RouteComponent
})

function RouteComponent() {
  const crpc = useCRPC()
  const { data } = useQuery(crpc.user.q.getCurrentChannel.queryOptions())
  return (
    <PageWrapper>
      <div>
        {data ? (
          <div> you talk on this channel: {data.name}</div>
        ) : (
          <div>you are not in any vs channel</div>
        )}
      </div>
      <Outlet />
    </PageWrapper>
  )
}
