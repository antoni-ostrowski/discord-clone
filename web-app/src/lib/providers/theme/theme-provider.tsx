import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, use, type PropsWithChildren } from "react"
import {
  getTheme,
  setThemeServerFn,
  themeStorageKey,
  type T as Theme
} from "./theme"

type ThemeContextVal = { theme: Theme; setTheme: (val: Theme) => void }
type Props = PropsWithChildren<{ theme: Theme }>

const ThemeContext = createContext<ThemeContextVal | null>(null)

export function ThemeProvider({ children, theme }: Props) {
  const qc = useQueryClient()

  function setTheme(val: Theme) {
    document.cookie = `${themeStorageKey}=${val}; path=/; max-age=31536000; SameSite=Lax`

    qc.invalidateQueries({ queryKey: ["theme"] })
    setThemeServerFn({ data: val })
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}

export function useTheme() {
  const val = use(ThemeContext)
  if (!val) throw new Error("useTheme called outside of ThemeProvider!")
  return val
}

export function useGetTheme() {
  const { data: theme } = useQuery({
    queryKey: ["theme"],
    queryFn: getTheme,
    staleTime: Infinity
  })
  const theme2 = getTheme()
  const value = theme ?? theme2
  return value
}
