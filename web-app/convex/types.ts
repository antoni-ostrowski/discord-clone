import { api } from "@convex/api"
import type {
  inferApiInputs,
  inferApiOutputs,
  WithHttpRouter
} from "better-convex/server"
import { appRouter } from "./functions/http"

export type Api = WithHttpRouter<typeof api, typeof appRouter>
export type ApiInputs = inferApiInputs<Api>
export type ApiOutputs = inferApiOutputs<Api>
