import { clsx, type ClassValue } from "clsx"
import { ConvexError } from "convex/values"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseConvexError(error: unknown) {
  const errMess =
    error instanceof ConvexError
      ? (error.data as string)
      : `[ERROR] Unexpected error occurred - ${error}`
  return errMess
}

export function getCurrentUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

type Success<T> = [T, null]
type Failure<E> = [null, E]
type Result<T, E = Error> = Success<T> | Failure<E>

export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    return [null, error as E]
  }
}

export function tryCatchSync<T, E = Error>(func: () => T): Result<T, E> {
  try {
    const data = func()
    return [data, null]
  } catch (error) {
    return [null, error as E]
  }
}

export const isAuthError = (error: unknown) => {
  const message =
    (error instanceof ConvexError && error.data) ||
    (error instanceof Error && error.message) ||
    ""
  return /auth/i.test(message)
}
