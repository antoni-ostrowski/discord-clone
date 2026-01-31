import { authMiddleware } from "better-convex/auth"
import { createHttpRouter } from "better-convex/server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { router } from "../lib/crpc"
import "../lib/http-polyfills"
import { createAuth } from "./auth"

const app = new Hono()

// CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: process.env.SITE_URL ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
    exposeHeaders: ["Set-Better-Auth-Cookie"],
    credentials: true
  })
)

// Better Auth middleware
app.use(authMiddleware(createAuth))

export const appRouter = router({
  // Add your routers here
})

export default createHttpRouter(app, appRouter)
