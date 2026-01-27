import { Layer, ManagedRuntime } from "effect"
import { TodoApi } from "./todo/api"

const appLayer = Layer.mergeAll(TodoApi.Default)

export const appRuntime = ManagedRuntime.make(appLayer)
