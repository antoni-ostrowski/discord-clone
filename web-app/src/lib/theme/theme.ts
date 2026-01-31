import { createIsomorphicFn, createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { Schema } from "effect"

const postThemeValidator = Schema.standardSchemaV1(
  Schema.Union(Schema.Literal("light"), Schema.Literal("dark"))
)

export type T = Schema.Schema.Type<typeof postThemeValidator>

export const themeStorageKey = "_preferred-theme"

export const getTheme = createIsomorphicFn()
  .server(() => {
    return (getCookie(themeStorageKey) || "light") as T
  })
  .client(() => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${themeStorageKey}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() as T
    return "dark"
  })

export const setThemeServerFn = createServerFn({ method: "POST" })
  .inputValidator(postThemeValidator)
  .handler(async ({ data }) => {
    setCookie(themeStorageKey, data)
  })
