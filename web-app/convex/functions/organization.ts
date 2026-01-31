import { Id } from "@convex/dataModel"
import { MutationCtx } from "@convex/server"
import { CRPCError } from "better-convex/server"
import { entsTableFactory } from "convex-ents"
import { asyncMap } from "convex-helpers"
import { zid } from "convex-helpers/server/zod4"
import { z } from "zod"
import { authMutation, authQuery } from "../lib/crpc"
import { entDefinitions } from "./schema"

export const createPersonalOrganization = async (
  ctx: MutationCtx,
  args: {
    email: string
    image: string | null
    name: string
    userId: Id<"user">
  }
) => {
  const table = entsTableFactory(ctx, entDefinitions)
  // Check if user already has any organizations
  const user = await table("user").getX(args.userId)

  if (user.personalOrganizationId) {
    return null
  }

  // Generate unique slug for personal org
  const slug = `personal-${args.userId.slice(-8)}`

  const orgId = await table("organization").insert({
    logo: args.image || undefined,
    name: `${args.name}'s Organization`,
    slug,
    createdAt: Date.now()
  })
  await table("member").insert({
    createdAt: Date.now(),
    role: "owner",
    organizationId: orgId,
    userId: args.userId
  })

  // Update the user's last active organization and personal organization ID for future sessions
  await table("user").getX(args.userId).patch({
    lastActiveOrganizationId: orgId,
    personalOrganizationId: orgId
  })

  return {
    id: orgId,
    slug
  }
}

export const list = authQuery
  .output(
    z.object({
      organizations: z.array(
        z.object({
          id: zid("organization"),
          name: z.string(),
          slug: z.string(),
          logo: z.string().nullish(),
          isPersonal: z.boolean()
        })
      )
    })
  )
  .query(async ({ ctx }) => {
    const members = await ctx.table("member", "userId", (q) =>
      q.eq("userId", ctx.userId)
    )

    const orgs = await asyncMap(members, async (member) => {
      const org = await member.edgeX("organization")
      return {
        id: org._id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        isPersonal: org._id === ctx.user.personalOrganizationId
      }
    })

    return { organizations: orgs }
  })

export const createOrganization = authMutation
  .meta({ rateLimit: "organization/create" })
  .input(z.object({ name: z.string().min(1).max(100) }))
  .output(z.object({ id: zid("organization"), slug: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Generate unique slug
    let slug = input.name
    let attempt = 0

    while (attempt < 10) {
      // Check if slug is already taken
      const existingOrg = await ctx.table("organization").get("slug", slug)

      if (!existingOrg) {
        break // Slug is available!
      }

      // Add random suffix for uniqueness
      slug = `${slug}-${Math.random().toString(36).slice(2, 10)}`
      attempt++
    }

    if (attempt >= 10) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message:
          "Could not generate a unique slug. Please provide a custom slug."
      })
    }

    // Create organization via Better Auth
    const org = await ctx.auth.api.createOrganization({
      body: {
        name: input.name,
        slug
      },
      headers: ctx.auth.headers
    })

    if (!org) {
      throw new CRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create organization"
      })
    }

    await ctx.auth.api.setActiveOrganization({
      body: { organizationId: org.id },
      headers: ctx.auth.headers
    })

    return {
      id: org.id as Id<"organization">,
      slug: org.slug
    }
  })
