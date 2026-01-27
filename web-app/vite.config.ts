import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const config = defineConfig({
  ssr: {
    noExternal: ["@convex-dev/better-auth"]
  },
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    })
  ]
})

export default config
