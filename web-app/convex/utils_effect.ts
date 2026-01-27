import { ConvexError } from "convex/values"
import { Data, Effect, Either, ManagedRuntime } from "effect"
import { AuthType } from "./auth"
import { MyUser } from "./betterAuth/schema"

export const getUserEff = Effect.fn(function* (fn: () => Promise<MyUser>) {
  return yield* Effect.tryPromise({
    try: async () => fn(),
    catch: (cause) => new NotAuthenticated({ cause })
  })
})

export const getAuthEff = Effect.fn(function* (fn: () => Promise<AuthType>) {
  return yield* Effect.tryPromise({
    try: async () => fn(),
    catch: (cause) =>
      new ServerError({ cause, message: "failed to get auth obj" })
  })
})

/**
 * execute the final eff that returns the success data or wraps the failure in ConvexError,
 * (so client can easly read err message via parseConvexError util)
 * R = The requirements provided by the ManagedRuntime
 * E_Runtime = Errors that can occur during runtime initialization
 */
export async function runEffOrThrow<A, E, R, E_Runtime>(
  runtime: ManagedRuntime.ManagedRuntime<R, E_Runtime>,
  eff: Effect.Effect<A, E, R>
): Promise<A> {
  const result = await runtime.runPromise(Effect.either(eff))

  if (Either.isLeft(result)) {
    const error = result.left
    const errorMessage =
      (error as Error).message ||
      (typeof error === "string" ? error : "An unexpected error occurred")

    Effect.runSync(Effect.logError(error))

    throw new ConvexError(errorMessage)
  }

  return result.right
}

export class ServerError extends Data.TaggedError("ServerError")<{
  message?: string
  cause?: unknown
}> {
  constructor(args?: { message?: string; cause?: unknown }) {
    super({
      message: args?.message ?? "Server error",
      cause: args?.cause
    })
  }
}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message?: string
  cause?: unknown
}> {
  constructor(args?: { message?: string; cause?: unknown }) {
    super({
      message: args?.message ?? "Database error",
      cause: args?.cause
    })
  }
}

export class NotFound extends Data.TaggedError("NotFound")<{
  message?: string
  cause?: unknown
}> {
  constructor(args?: { message?: string; cause?: unknown }) {
    super({
      message: args?.message ?? "Entity not found",
      cause: args?.cause
    })
  }
}

export class NotAuthenticated extends Data.TaggedError("NotAuthenticated")<{
  message?: string
  cause?: unknown
}> {
  constructor(args?: { message?: string; cause?: unknown }) {
    super({
      message: args?.message ?? "not authenticated",
      cause: args?.cause
    })
  }
}
