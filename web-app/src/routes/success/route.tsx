import { createFileRoute, redirect } from "@tanstack/react-router"
import { Schema } from "effect"

const successSearchParams = Schema.standardSchemaV1(
  Schema.Struct({
    checkout_id: Schema.NonEmptyString
  })
)

export const Route = createFileRoute("/success")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: RouteComponent,
  validateSearch: successSearchParams
})

function RouteComponent() {
  const { checkout_id } = Route.useSearch()

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      Success! checkout id: {checkout_id}
    </div>
  )
}
