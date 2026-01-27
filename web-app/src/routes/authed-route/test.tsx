import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/lib/auth-client"
import { parseConvexError } from "@/lib/utils"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/authed-route/test")({
  beforeLoad: async (ctx) => {
    if (!ctx.context.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { user } = useSession()
  console.log({ user })

  const [input, setInput] = useState("")

  const { mutate: createNewTodo } = useMutation({
    meta: {
      withToasts: true,
      loadingMessage: "Creating todo",
      successMessage: "Created todo"
    },
    mutationFn: useConvexMutation(api.todo.mutations.create)
  })

  const { mutate: deleteTodo } = useMutation({
    meta: {
      withToasts: true,
      loadingMessage: "Deleting todo",
      successMessage: "Deleted todo"
    },
    mutationFn: useConvexMutation(api.todo.mutations.remove)
  })
  const { data, error } = useQuery(convexQuery(api.todo.queries.list, {}))
  const { mutate } = useMutation({
    meta: {
      withToasts: true,
      successMessage: "Toggled todo!",
      loadingMessage: "Loading..."
    },
    mutationFn: useConvexMutation(api.todo.mutations.toggle)
  })

  return (
    <PageWrapper>
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">
          Hi {user?.name}! ({user?.email})
        </h1>
        <h1 className="text-2xl font-bold">
          You can access this page only when you are authenticated.
        </h1>

        <p className="text-muted-foreground">
          Try accessing this page manually with url when signed out.
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
              createNewTodo({ text: input })
              setInput("")
            }}
          >
            <PlusIcon />
          </Button>

          {error && (
            <p className="text-destructive">{parseConvexError(error)}</p>
          )}
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
                    mutate({ id: a._id })
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
      </div>
    </PageWrapper>
  )
}
