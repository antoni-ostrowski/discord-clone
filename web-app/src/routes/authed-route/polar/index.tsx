import FullScreenLoading from "@/components/shared/loading-screen"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { polarClient } from "@/lib/polar"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useState } from "react"

const getProducts = createServerFn().handler(async () => {
  const products = await polarClient.products.list({})
  return { products: products.result.items }
})

export const Route = createFileRoute("/authed-route/polar/")({
  component: RouteComponent,
  pendingComponent: () => <FullScreenLoading />
})

function RouteComponent() {
  const [isNavigating, setIsNavigating] = useState(false)

  const { data } = useSuspenseQuery({
    queryKey: ["products", "list"],
    queryFn: () => getProducts()
  })

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <div>
        <h1>Add products in polar dashboard to see them here</h1>
      </div>
      {data.products.map((product) => {
        return (
          <Card key={product.id} className="min-w-sm">
            <CardHeader>
              <CardTitle>
                <h1 className="text-xl">{product.name}</h1>
              </CardTitle>
              <CardDescription>
                <p>{product.id}</p>
                <p>{product.description}</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={async () => {
                  await authClient.checkout({
                    products: [product.id]
                  })
                }}
              >
                Subscribe
              </Button>
            </CardContent>
          </Card>
        )
      })}
      <div className="flex flex-col items-center justify-center">
        <Button
          variant={"outline"}
          size={"lg"}
          onClick={async () => {
            setIsNavigating(true)
            await authClient.customer.portal()
          }}
        >
          {isNavigating ? <Spinner /> : "My active subscription"}
        </Button>
      </div>
    </div>
  )
}
