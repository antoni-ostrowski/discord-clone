import { CRPCError } from "better-convex/server"
import { Data, Effect, Either, ManagedRuntime, pipe } from "effect"

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

    Effect.runSync(Effect.logError(error))

    throw new CRPCError({
      message: "internal server error",
      code: "INTERNAL_SERVER_ERROR"
    })
  }

  return result.right
}

/**
 * Creates an Effect from a Promise, handling errors and logging.
 *
 * @template A - The success type of the promise.
 * @template E - The custom error type to throw on promise rejection.
 * @template R - The context/environment required by the promise factory (if any).
 * @param {() => Promise<A>} promiseFactory - A function that returns the Promise to be wrapped.
 * @param {(cause: unknown, message: string) => E} errorFactory - A function to map the unknown promise rejection cause to your specific error type E.
 * @param {string} [errorMessage] - An optional custom error message. Defaults to "Promise failed".
 * @returns {Effect.Effect<A, E, R>} An Effect that resolves to the promise's success value, or your custom error E.
 */
export function effectifyPromise<A, E, R = never>(
  promiseFactory: () => Promise<A>,
  errorFactory: (cause: unknown, message: string) => E,
  errorMessage: string = "Promise failed"
): Effect.Effect<A, E, R> {
  return pipe(
    Effect.tryPromise({
      try: promiseFactory,
      catch: (cause) => errorFactory(cause, errorMessage)
    }),
    Effect.tapError((error) =>
      Effect.logError("Effectified Promise Error:", error)
    )
  )
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

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
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
