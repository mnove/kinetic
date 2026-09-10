import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { ThemeProvider } from "@/components/theme-provider"

import appCss from "../styles.css?url"

const siteUrl = "https://kinetic-art.mnove.workers.dev"
const title = "Kinetic — Studies in motion"
// Deliberately count-free so adding studies never makes this stale (the same
// reason og.png carries no number).
const description =
  "Interactive studies in motion. Simple rules, infinite motion."

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title,
      },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Kinetic" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: `${siteUrl}/og.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Kinetic — studies in motion",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${siteUrl}/og.png` },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // SVG first so modern browsers use the crisp, theme-aware mark; .ico
      // stays as the fallback for browsers that ignore rel="icon" SVG.
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
