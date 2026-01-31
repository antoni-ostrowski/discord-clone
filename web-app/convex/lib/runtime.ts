import { Layer, ManagedRuntime } from "effect"

const appLayer = Layer.mergeAll(Layer.empty)

export const appRuntime = ManagedRuntime.make(appLayer)
