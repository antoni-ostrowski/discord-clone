"use node"

import { v } from "convex/values"
import { Effect } from "effect"
import { PostHog } from "posthog-node"
import { action } from "./_generated/server"

let _posthog: PostHog | null = null

function getPostHog() {
  const key = process.env.POSTHOG_KEY
  const host = process.env.POSTHOG_HOST

  if (!key || !host) {
    Effect.runSync(Effect.logError("No posthog envs in convex!"))
    throw new Error("No posthog envs in convex!")
  }

  if (!_posthog) {
    _posthog = new PostHog(key, {
      host: host,
      flushAt: 1,
      flushInterval: 0
    })
  }
  return _posthog
}

const phEvents = v.object({
  distinctId: v.string(),
  groups: v.optional(v.record(v.string(), v.string())),
  timestamp: v.optional(v.string()),
  entry: v.union(
    v.object({
      type: v.literal("capture"),
      event: v.literal("some_event"),
      properties: v.object({
        plan: v.union(v.literal("free"), v.literal("pro"))
      })
    }),
    v.object({
      type: v.literal("identify"),
      event: v.literal("$identify"),
      properties: v.object({
        email: v.string(),
        name: v.optional(v.string())
      })
    })
  )
})

export const captureEvent = action({
  args: phEvents,
  handler: async (_, args) => {
    const client = getPostHog()

    console.log("[posthog] Event captured! ", args)

    if (args.entry.type === "identify") {
      client.identify({
        distinctId: args.distinctId,
        properties: {
          $set: args.entry.properties
        }
      })
    } else {
      client.capture({
        distinctId: args.distinctId,
        event: args.entry.event,
        properties: args.entry.properties
      })
    }

    await client.flush()
  }
})
