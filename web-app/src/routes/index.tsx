import { Button } from "@/components/ui/button"
import { usePostHog } from "@posthog/react"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: App
})

function App() {
  const ph = usePostHog()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">welcome</h1>

      <div className="font-semibold">
        <Link to="/authed-route/test" className="hover:underline">
          <p>
            /authed-route/test - checkout authenticated route with todo example
          </p>
        </Link>
      </div>

      <div className="font-semibold">
        <Link to="/authed-route/polar" className="hover:underline">
          <p>/authed-route/polar - checkout polar subscriptions</p>
        </Link>
      </div>
      <h2 className="text-muted-foreground">
        Try toggling the todo state from convex dashboard and see how client
        reacts.
      </h2>

      <Button
        className={"mt-4"}
        variant={"outline"}
        onClick={() => {
          try {
            ph.capture("some-event", {
              somepropert: "fjkdslfjsklf"
            })
            console.log("captured")
          } catch (e) {
            console.error(e)
          }
        }}
      >
        Send test client posthog event
      </Button>
    </div>
  )
}
