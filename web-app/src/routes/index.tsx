import SignOutBtn from "@/components/auth/sign-out-btn"
import PageWrapper from "@/components/shared/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient, useSession } from "@/lib/auth-client"
import { useCRPC } from "@/lib/convex/cprc"
import ThemeToggle from "@/lib/theme/theme-toggle"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Authenticated } from "better-convex/react"
import { TrashIcon } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/")({
  component: App
})

function App() {
  const { user } = useSession()
  const crpc = useCRPC()
  const { data } = useQuery(crpc.organization.list.queryOptions())
  const activeOrg = authClient.useActiveOrganization()
  const { mutate: createOrg, isPending } = useMutation(
    crpc.organization.createOrganization.mutationOptions()
  )
  const [newOrgName, setNewOrgName] = useState("")

  return (
    <PageWrapper className="h-screen">
      <div className="flex flex-row gap-2 py-4">
        <SignOutBtn />
        <div>
          <ThemeToggle />
        </div>
      </div>
      <Authenticated>
        <p>hello {user?.name}</p>

        <div className="flex flex-col items-center justify-center">
          <h1>
            active org:{" "}
            {activeOrg.data?.name ?? "no active org in this session"}
          </h1>
        </div>
        <Link to="/todos" className="underline">
          todos
        </Link>
        <div className="flex flex-col items-start justify-center">
          <h1 className="font-bold">your orgs</h1>
          {data?.organizations.map((org) => {
            return (
              <li key={org.id}>
                <div className="flex flex-row gap-2">
                  <Button
                    variant={"destructive"}
                    onClick={() =>
                      authClient.organization.delete({
                        organizationId: org.id
                      })
                    }
                  >
                    <TrashIcon />
                  </Button>
                  {org.id !== activeOrg.data?.id && (
                    <Button
                      variant={"secondary"}
                      onClick={() =>
                        authClient.organization.setActive({
                          organizationId: org.id
                        })
                      }
                    >
                      set as active
                    </Button>
                  )}

                  <p>{org.name}</p>
                </div>
              </li>
            )
          })}
        </div>

        <div className="flex flex-row items-center justify-center gap-2 py-4">
          <Input
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <Button
            onClick={() => {
              createOrg({ name: newOrgName })
              setNewOrgName("")
            }}
          >
            {isPending ? <Spinner /> : "create org"}
          </Button>
        </div>
      </Authenticated>
    </PageWrapper>
  )
}
