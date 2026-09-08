import { Link } from "@tanstack/react-router"
import { ArrowUpRight } from "lucide-react"
import { studies } from "@/lib/studies"

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Kinetic home">
        <span className="brand-mark">
          <i />
          <i />
          <i />
        </span>
        kinetic<span className="brand-period">.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link to="/" activeProps={{ className: "nav-active" }}>
          The collection{" "}
          <span className="nav-count">
            {String(studies.length).padStart(2, "0")}
          </span>
        </Link>
        <a href="/#about">
          About the project <ArrowUpRight size={13} />
        </a>
      </nav>
      <span className="header-note">
        <span className="live-dot" /> An ongoing exploration
      </span>
    </header>
  )
}
