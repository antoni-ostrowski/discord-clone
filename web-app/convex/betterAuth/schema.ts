import { typedV } from "convex-helpers/validators"
import { defineSchema } from "convex/server"
import { Infer } from "convex/values"
import { Id } from "./_generated/dataModel"
import { tables } from "./generatedSchema"

// here you can define custom indexes
const authSchema = defineSchema({
  ...tables
})

export const authVv = typedV(authSchema)

export default authSchema

const userValidator = authVv.doc("user")

export type MyUser = Infer<typeof userValidator>

export type MyUserId = Id<"user">
