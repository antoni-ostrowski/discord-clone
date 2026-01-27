import { ConvexQueryClient } from "@convex-dev/react-query"
import {
  MutationCache,
  QueryClient,
  QueryKey,
  notifyManager
} from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { Effect } from "effect"
import { toast } from "sonner"
import { DefaultCatchBoundary } from "./components/router/default-error-boundary"
import { NotFound } from "./components/router/default-not-found"
import { env } from "./env"
import { parseConvexError } from "./lib/utils"
import { routeTree } from "./routeTree.gen"

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey
      withToasts?: boolean
      successMessage?: string
      errorMessage?: string
      loadingMessage?: string
    }
  }
}
export function getRouter() {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  if (!env.VITE_CONVEX_URL) {
    Effect.runSync(Effect.logError("missing envar VITE_CONVEX_URL"))
  }

  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    expectAuth: true
  })

  const queryClient: QueryClient = new QueryClient({
    mutationCache: new MutationCache({
      onMutate: (_data, _variables, _context) => {
        if (_context.meta?.withToasts && _context.meta.loadingMessage) {
          toast.loading(_context.meta.loadingMessage, {
            id: _variables.mutationId
          })
        }
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage && mutation.meta.withToasts) {
          toast.success(mutation.meta.successMessage, {
            id: mutation.mutationId
          })
        }
      },
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.meta?.errorMessage || mutation.meta?.withToasts) {
          toast.error(parseConvexError(_error), { id: mutation.mutationId })
        }
      },
      onSettled: async (_data, _error, _variables, _context, mutation) => {
        {
          if (mutation.meta?.invalidatesQuery) {
            await queryClient.invalidateQueries({
              queryKey: mutation.meta?.invalidatesQuery
            })
          }
        }
      }
    }),
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn()
      }
    }
  })

  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    context: { queryClient, convexQueryClient }
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
