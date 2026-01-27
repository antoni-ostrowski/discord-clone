import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/authed-route")({
  beforeLoad: async (ctx) => {
    if (!ctx.context.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div className="h-screen w-screen">
      <Outlet />
    </div>
  )
}
