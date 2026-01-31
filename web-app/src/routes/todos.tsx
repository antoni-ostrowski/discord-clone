import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/lib/auth-client"
import { useCRPC } from "@/lib/convex/cprc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/todos")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const [input, setInput] = useState("")
  const { user } = useSession()
  const crpc = useCRPC()

  const { mutate: createTodo } = useMutation(
    crpc.todo.m.create.mutationOptions({
      meta: {
        withToasts: true,
        loadingMessage: "creating todo.."
      }
    })
  )

  const { mutate: deleteTodo } = useMutation(
    crpc.todo.m.remove.mutationOptions()
  )

  const { mutate: toggleTodo } = useMutation(
    crpc.todo.m.toggle.mutationOptions()
  )

  const { data, error } = useQuery(crpc.todo.q.list.queryOptions())

  return (
    <PageWrapper className="h-screen">
      <h1>
        Hi {user?.name}! ({user?.email})
      </h1>
      <h1>You can access this page only when you are authenticated.</h1>

      <p className="text-muted-foreground">
        Try accessing this page manually when signed out to test.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder="Todo text"
          />
        </div>

        <Button
          onClick={async () => {
            createTodo({ text: input })
            setInput("")
          }}
        >
          <PlusIcon />
        </Button>

        {error && <p className="text-destructive">{error.message}</p>}
        {data?.map((a) => {
          return (
            <div
              key={a._id}
              className="flex w-30 flex-row items-center justify-start gap-2"
            >
              <input
                type="checkbox"
                checked={a.completed}
                onChange={() => {
                  toggleTodo({ id: a._id })
                }}
              />
              <Button
                variant={"ghost"}
                onClick={() => {
                  deleteTodo({
                    todoId: a._id
                  })
                }}
              >
                <XIcon />
              </Button>

              {a.text}
            </div>
          )
        })}
      </div>
    </PageWrapper>
  )
}
