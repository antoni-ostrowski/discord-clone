import { Doc } from "@convex/dataModel"
import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents"
import { convexToZod } from "convex-helpers/server/zod4"
import { typedV } from "convex-helpers/validators"
import { v } from "convex/values"

const schema = defineEntSchema({
  session: defineEnt({
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.union(v.null(), v.string())),
    userAgent: v.optional(v.union(v.null(), v.string())),
    impersonatedBy: v.optional(v.union(v.null(), v.string())),
    activeOrganizationId: v.optional(v.union(v.null(), v.string()))
  })
    .field("token", v.string(), { index: true })
    .edge("user", { to: "user", field: "userId" })
    .index("expiresAt", ["expiresAt"])
    .index("expiresAt_userId", ["expiresAt", "userId"]),

  account: defineEnt({
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.union(v.null(), v.string())),
    refreshToken: v.optional(v.union(v.null(), v.string())),
    idToken: v.optional(v.union(v.null(), v.string())),
    accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    scope: v.optional(v.union(v.null(), v.string())),
    password: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .edge("user", { to: "user", field: "userId" })
    .index("accountId", ["accountId"])
    .index("accountId_providerId", ["accountId", "providerId"])
    .index("providerId_userId", ["providerId", "userId"]),

  verification: defineEnt({
    value: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .field("identifier", v.string(), { index: true })
    .field("expiresAt", v.number(), { index: true }),

  organization: defineEnt({
    logo: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    metadata: v.optional(v.union(v.null(), v.string()))
  })
    .field("slug", v.string(), { unique: true })
    .field("name", v.string(), { index: true })
    .edges("members", { to: "member", ref: true })
    .edges("invitations", { to: "invitation", ref: true })
    .edges("usersLastActive", {
      to: "user",
      ref: "lastActiveOrganizationId"
    })
    .edges("usersPersonal", { to: "user", ref: "personalOrganizationId" }),

  member: defineEnt({
    createdAt: v.number()
  })
    .field("role", v.string(), { index: true })
    .edge("organization", { to: "organization", field: "organizationId" })
    .edge("user", { to: "user", field: "userId" })
    .index("organizationId_userId", ["organizationId", "userId"])
    .index("organizationId_role", ["organizationId", "role"]),

  invitation: defineEnt({
    role: v.optional(v.union(v.null(), v.string())),
    expiresAt: v.number(),
    createdAt: v.number()
  })
    .field("email", v.string(), { index: true })
    .field("status", v.string(), { index: true })
    .edge("organization", { to: "organization", field: "organizationId" })
    .edge("inviter", { to: "user", field: "inviterId" })
    .index("email_organizationId_status", ["email", "organizationId", "status"])
    .index("organizationId_status", ["organizationId", "status"])
    .index("email_status", ["email", "status"])
    .index("organizationId_email", ["organizationId", "email"])
    .index("organizationId_email_status", [
      "organizationId",
      "email",
      "status"
    ]),

  jwks: defineEnt({
    publicKey: v.string(),
    privateKey: v.string(),
    createdAt: v.number()
  }),

  // --------------------
  // Unified User Model (App + Better Auth)
  // --------------------
  user: defineEnt({
    // Better Auth required fields
    name: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Better Auth optional fields
    image: v.optional(v.union(v.null(), v.string())),
    role: v.optional(v.union(v.null(), v.string())),
    banned: v.optional(v.union(v.null(), v.boolean())),
    banReason: v.optional(v.union(v.null(), v.string())),
    banExpires: v.optional(v.union(v.null(), v.number())),
    bio: v.optional(v.union(v.null(), v.string())),
    firstName: v.optional(v.union(v.null(), v.string())),
    github: v.optional(v.union(v.null(), v.string())),
    lastName: v.optional(v.union(v.null(), v.string())),
    linkedin: v.optional(v.union(v.null(), v.string())),
    location: v.optional(v.union(v.null(), v.string())),
    website: v.optional(v.union(v.null(), v.string())),
    x: v.optional(v.union(v.null(), v.string())),

    // App-specific fields
    deletedAt: v.optional(v.number())
  })
    .field("email", v.string(), { unique: true })
    .field("customerId", v.optional(v.string()), { index: true })
    // Better Auth edges
    .edges("sessions", { to: "session", ref: "userId" })
    .edges("accounts", { to: "account", ref: "userId" })
    .edges("members", { to: "member", ref: "userId" })
    .edges("invitations", { to: "invitation", ref: "inviterId" })
    // App-specific edges
    .edge("lastActiveOrganization", {
      to: "organization",
      field: "lastActiveOrganizationId",
      optional: true
    })
    .edge("personalOrganization", {
      to: "organization",
      field: "personalOrganizationId",
      optional: true
    })
    .edges("todo", { ref: true })
    // Indexes from both tables
    .index("email_name", ["email", "name"])
    .index("name", ["name"]),

  todo: defineEnt({
    text: v.string(),
    completed: v.boolean()
  }).edge("user", {
    to: "user",
    field: "userId"
  })
})

export default schema
export const entDefinitions = getEntDefinitions(schema)
export const vv = typedV(schema)

export const userZod = convexToZod(vv.doc("user"))
export const sessionZod = convexToZod(vv.doc("session"))
export const accountZod = convexToZod(vv.doc("account"))
export const verificationZod = convexToZod(vv.doc("verification"))
export const jwksZod = convexToZod(vv.doc("jwks"))
export const todoZod = convexToZod(vv.doc("todo"))
export const memberZod = convexToZod(vv.doc("member"))
export const orgZod = convexToZod(vv.doc("organization"))
export const invitationZod = convexToZod(vv.doc("invitation"))

export type UserType = Doc<"user">
export type SessionType = Doc<"session">
export type AccountType = Doc<"account">
export type VerificationType = Doc<"verification">
export type JwksType = Doc<"jwks">
export type TodoType = Doc<"todo">
export type MemberType = Doc<"member">
export type OrgType = Doc<"organization">
export type InvitationType = Doc<"invitation">
