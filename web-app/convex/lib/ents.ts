import type { GenericEnt, GenericEntWriter } from "convex-ents"
import { entsTableFactory, getEntDefinitions } from "convex-ents"
import type { TableNames } from "../functions/_generated/dataModel"
import type {
  MutationCtx as BaseMutationCtx,
  QueryCtx as BaseQueryCtx
} from "../functions/_generated/server"
import schema from "../functions/schema"

export const entDefinitions = getEntDefinitions(schema)

export type Ent<TableName extends TableNames> = GenericEnt<
  typeof entDefinitions,
  TableName
>

export type EntWriter<TableName extends TableNames> = GenericEntWriter<
  typeof entDefinitions,
  TableName
>

export const getCtxWithTable = <Ctx extends BaseMutationCtx | BaseQueryCtx>(
  ctx: Ctx
) => ({
  ...ctx,
  table: entsTableFactory(ctx, entDefinitions)
})

export type QueryCtx = ReturnType<typeof getCtxWithTable<BaseQueryCtx>>

export type MutationCtx = ReturnType<typeof getCtxWithTable<BaseMutationCtx>>
