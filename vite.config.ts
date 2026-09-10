import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Cloudflare Workers' not_found_handling: "404-page" needs a literal 404.html.
// The prerenderer can't emit one itself (it throws on any non-2xx response), so
// reuse the index render: the client router resolves the real URL on hydration
// and renders the root route's notFoundComponent.
const notFoundPath = resolve(import.meta.dirname, "dist/client/404.html")
async function writeNotFoundPage({
  page,
  html,
}: {
  page: { path: string }
  html: string
}) {
  if (page.path !== "/") return
  await mkdir(dirname(notFoundPath), { recursive: true })
  await writeFile(notFoundPath, html)
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      // Every route's data comes from the static `studies` array, so the whole
      // site can be emitted as HTML at build time. crawlLinks follows the index
      // grid's links to reach each /studies/$slug page.
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        onSuccess: writeNotFoundPage,
      },
      pages: [{ path: "/" }],
    }),
    viteReact(),
  ],
})

export default config
