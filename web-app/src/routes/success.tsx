import PageWrapper from "@/components/shared/page-wrapper"
import { createFileRoute } from "@tanstack/react-router"
import { Schema } from "effect"
import { CheckCircle } from "lucide-react"

export const Route = createFileRoute("/success")({
  component: RouteComponent,
  validateSearch: Schema.standardSchemaV1(
    Schema.Struct({ checkout_id: Schema.String })
  )
})

function RouteComponent() {
  const { checkout_id } = Route.useSearch()
  return (
    <PageWrapper>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 rounded-full bg-green-500/10 p-4">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription has been activated. You now have access to premium
          features.
        </p>
        {checkout_id && (
          <p className="text-muted-foreground mb-6 font-mono text-xs">
            Checkout ID: {checkout_id}
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
