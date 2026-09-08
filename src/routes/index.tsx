import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowDown, ArrowUpRight, MoveUpRight, Pause, Play } from "lucide-react"
import { useState } from "react"
import { Artwork } from "@/components/artwork"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { studies } from "@/lib/studies"

export const Route = createFileRoute("/")({ component: Gallery })
function Gallery() {
  const [filter, setFilter] = useState("All studies")
  const [playing, setPlaying] = useState(true)
  const shown = studies.filter(
    (s) => filter === "All studies" || s.category === filter
  )
  return (
    <>
      <SiteHeader />
      <main className="gallery">
        <section className="intro">
          <div className="eyebrow">
            <span className="tiny-cross">+</span> A COLLECTION OF MOTION STUDIES
          </div>
          <div className="intro-row">
            <h1>
              Simple rules.
              <br />
              <span>Infinite motion.</span>
            </h1>
            <div className="intro-aside">
              <p>
                Experiments in geometry, rhythm, and perception.
                <br />A small playground for things that never stand still.
              </p>
              <a href="#collection">
                Find your moment of motion <ArrowDown size={15} />
              </a>
            </div>
          </div>
          <div className="intro-bottom">
            <span>MATHEMATICS, MADE MESMERIZING.</span>
            <span>
              EST. 2026 <span className="separator">/</span> VOL. 001
            </span>
          </div>
        </section>
        <section id="collection" className="collection">
          <div className="collection-toolbar">
            <ToggleGroup
              className="filter-list"
              aria-label="Filter studies"
              value={[filter]}
              onValueChange={(values) => {
                if (values.length) setFilter(values[0])
              }}
            >
              {[
                "All studies",
                ...new Set(studies.map((study) => study.category)),
              ].map((f) => (
                <ToggleGroupItem key={f} value={f} className="filter">
                  {f}
                  {f === "All studies" && (
                    <span>{String(studies.length).padStart(2, "0")}</span>
                  )}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              variant="ghost"
              size="sm"
              aria-label={playing ? "Pause previews" : "Play previews"}
              className="preview-toggle"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              <span>{playing ? "Pause previews" : "Play previews"}</span>
            </Button>
          </div>
          <div className="study-grid">
            {shown.map((study) => (
              <Link
                key={study.slug}
                to="/studies/$slug"
                params={{ slug: study.slug }}
                className="study-card"
              >
                <div
                  className="study-preview"
                  data-study-kind={study.kind}
                  style={{ background: study.color }}
                >
                  <div className="preview-top">
                    <span>STUDY {study.number}</span>
                    <span className="preview-status">
                      <i className={playing ? "" : "paused"} />
                      {playing ? "LIVE" : "PAUSED"}
                    </span>
                  </div>
                  <Artwork study={study} playing={playing} />
                  <div className="preview-bottom">
                    <span>{study.principle}</span>
                    <span className="enter-circle">
                      <MoveUpRight size={18} />
                    </span>
                  </div>
                </div>
                <div className="card-info">
                  <div>
                    <h2>{study.title}</h2>
                    <p>{study.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="category">
                    {study.category}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
          <div className="collection-end">
            <span>{studies.length} STUDIES. COUNTLESS WAYS TO SEE.</span>
            <span>
              More experiments to come <span className="tiny-cross">+</span>
            </span>
          </div>
        </section>
        <section id="about" className="about">
          <span className="eyebrow">A NOTE ON THE PROJECT</span>
          <h2>
            A little less scrolling.
            <br />A little more <em>looking.</em>
          </h2>
          <div>
            <p>
              Kinetic is a collection of small experiments in motion. Familiar
              shapes, simple mathematical rules, and the unexpected beauty that
              happens when they meet.
            </p>
            <p>Open a study. Change the rhythm. Stay for a while.</p>
            <a href="#collection">
              Explore the collection <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <Link to="/" className="footer-brand">
          kinetic.
        </Link>
        <span>Built with curiosity. Set in motion.</span>
        <span>© 2026</span>
      </footer>
    </>
  )
}
