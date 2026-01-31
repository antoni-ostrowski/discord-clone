import { DefaultCatchBoundary } from "@/components/router/default-error-boundary"
import { NotFound } from "@/components/router/default-not-found"
import { Toaster } from "@/components/ui/sonner"
import { authClient, getClientAuth, getServerAuth } from "@/lib/auth-client"
import { ThemeProvider, useGetTheme } from "@/lib/theme/theme-provider"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { isServer } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
  useRouter
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { ConvexAuthProvider } from "better-convex/auth-client"
import { VanillaCRPCClient } from "better-convex/crpc"
import { ConvexQueryClient, ConvexReactClient } from "better-convex/react"
import { Api } from "../../convex/types"
import appCss from "../styles.css?url"

export interface MyRouterContext {
  convexReactClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
  crpcClient: VanillaCRPCClient<Api>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "TanStack Start Starter"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  beforeLoad: async ({ context }) => {
    const auth = isServer
      ? await getServerAuth()
      : await getClientAuth(context.convexQueryClient.queryClient)

    return { auth }
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent
})
function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  const router = useRouter()

  return (
    <ConvexAuthProvider
      authClient={authClient}
      client={context.convexReactClient}
      onMutationUnauthorized={() => router.navigate({ to: "/sign-in" })}
      onQueryUnauthorized={() => router.navigate({ to: "/sign-in" })}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = useGetTheme()

  return (
    <ThemeProvider theme={theme}>
      <html lang="en" suppressHydrationWarning className={theme}>
        <head>
          <HeadContent />
        </head>
        <body>
          <Toaster />
          {children}
          <TanStackDevtools
            config={{
              position: "bottom-right"
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />
              },
              {
                name: "Tanstack Query",
                render: <ReactQueryDevtoolsPanel />
              }
            ]}
          />
          <Scripts />
        </body>
      </html>
    </ThemeProvider>
  )
}
