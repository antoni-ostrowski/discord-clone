import { api } from "@convex/api"
import { meta } from "@convex/meta"
import {
  DefaultOptions,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
  defaultShouldDehydrateQuery,
  notifyManager
} from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { isCRPCClientError } from "better-convex/crpc"
import {
  ConvexReactClient,
  createVanillaCRPCProxy,
  getConvexQueryClientSingleton,
  getQueryClientSingleton
} from "better-convex/react"
import { isCRPCError } from "better-convex/server"
import { Effect } from "effect"
import { toast } from "sonner"
import SuperJSON from "superjson"
import { DefaultCatchBoundary } from "./components/router/default-error-boundary"
import { NotFound } from "./components/router/default-not-found"
import { env } from "./env"
import { CRPCProvider } from "./lib/convex/cprc"
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

export const hydrationConfig: Pick<DefaultOptions, "dehydrate" | "hydrate"> = {
  dehydrate: {
    serializeData: SuperJSON.serialize,
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) || query.state.status === "pending",
    shouldRedactErrors: () => false
  },
  hydrate: {
    deserializeData: SuperJSON.deserialize
  }
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      ...hydrationConfig,
      queries: {
        staleTime: Infinity,
        retry: (failureCount, error) => {
          // Don't retry deterministic CRPC errors (auth, validation, HTTP 4xx)
          if (isCRPCError(error)) return false

          const message = error instanceof Error ? error.message : String(error)

          if (message.includes("timed out") && failureCount < 3) {
            console.warn(
              `[QueryClient] Retrying timed out query (attempt ${failureCount + 1}/3)`
            )
            return true
          }

          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30_000)
      }
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (isCRPCClientError(error)) {
          console.log(`[CRPC] ${error.code}:`, error.functionName)
        }
      }
    }),
    mutationCache: new MutationCache({
      onMutate: (_data, _variables, _context) => {
        if (_context.meta?.withToasts && _context.meta.loadingMessage) {
          toast.loading(_context.meta.loadingMessage, {
            id: _variables.mutationId
          })
        }
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        if (!mutation.meta?.successMessage && mutation.meta?.withToasts) {
          toast.dismiss(mutation.mutationId)
          return
        }
        if (mutation.meta?.successMessage && mutation.meta.withToasts) {
          toast.success(mutation.meta.successMessage, {
            id: mutation.mutationId
          })
        }
      },
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.meta?.errorMessage || mutation.meta?.withToasts) {
          toast.error(_error.message, { id: mutation.mutationId })
          if (isCRPCClientError(_error)) {
            console.log(`[CRPC] ${_error.code}:`, _error.functionName)
          }
        }
      }
    })
  })
}

export function getRouter() {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  if (!env.VITE_CONVEX_URL) {
    Effect.runSync(Effect.logError("missing envar VITE_CONVEX_URL"))
  }

  const queryClient = getQueryClientSingleton(createQueryClient)
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL)
  const convexQueryClient = getConvexQueryClientSingleton({
    convex,
    queryClient
  })

  const crpcClient = createVanillaCRPCProxy(api, meta, convex)

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <CRPCProvider
          convexClient={convex}
          convexQueryClient={convexQueryClient}
        >
          {children}
        </CRPCProvider>
      </QueryClientProvider>
    ),
    context: { convexReactClient: convex, convexQueryClient, crpcClient }
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
