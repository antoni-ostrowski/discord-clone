import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  memberAc,
  ownerAc
} from "better-auth/plugins/organization/access"

const statement = {
  ...defaultStatements
} as const

export const ac = createAccessControl(statement)

const member = ac.newRole({
  ...memberAc.statements
})

const owner = ac.newRole({
  ...ownerAc.statements
})

export const roles = { member, owner }
