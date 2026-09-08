import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react"
import { useState } from "react"
import { Artwork } from "@/components/artwork"
import { SiteHeader } from "@/components/site-header"
import { studies } from "@/lib/studies"
import type { Study } from "@/lib/studies"

export const Route = createFileRoute("/studies/$slug")({
  loader: ({ params }) => {
    const study = studies.find((s) => s.slug === params.slug)
    if (!study) throw notFound()
    return study
  },
  component: StudyRoute,
})
function StudyRoute() {
  const study = Route.useLoaderData()
  return <StudyPage key={study.slug} study={study} />
}
function StudyPage({ study }: { study: Study }) {
  const [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(1),
    [parameter, setParameter] = useState<number>(study.initial),
    [guides, setGuides] = useState(true),
    [reset, setReset] = useState(0)
  const next =
    studies[
      (studies.findIndex((s) => s.slug === study.slug) + 1) % studies.length
    ]
  return (
    <>
      <SiteHeader />
      <main className="detail">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} /> Back to the collection
        </Link>
        <div className="detail-heading">
          <div>
            <span className="eyebrow">
              STUDY {study.number} / {study.category.toUpperCase()}
            </span>
            <h1>
              {study.title}
              <span>.</span>
            </h1>
          </div>
          <p>{study.subtitle}</p>
        </div>
        <div className="study-workspace">
          <div className="large-preview" style={{ background: study.color }}>
            <div className="preview-top">
              <span>{study.principle.toUpperCase()}</span>
              <span>INTERACTIVE STUDY</span>
            </div>
            <Artwork
              study={study}
              playing={playing}
              speed={speed}
              parameter={parameter}
              guides={guides}
              reset={reset}
            />
            <span className="canvas-caption">
              SIMPLE RULES. INFINITE MOTION.
            </span>
          </div>
          <aside className="controls">
            <span className="eyebrow">MAKE IT YOUR OWN</span>
            <h2>A change of pace.</h2>
            <p>{study.description}</p>
            <div className="playback">
              <button
                className="primary-button"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
                {playing ? "Pause motion" : "Play motion"}
              </button>
              <button
                className="reset-button"
                aria-label="Reset study"
                title="Reset study"
                onClick={() => {
                  setReset((r) => r + 1)
                  setSpeed(1)
                  setParameter(study.initial)
                  setGuides(true)
                  setPlaying(true)
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <label className="slider-label" htmlFor="speed">
              Playback speed <output>{speed.toFixed(2)}×</output>
            </label>
            <input
              id="speed"
              type="range"
              min="0.25"
              max="2"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <label className="slider-label" htmlFor="geometry">
              {study.parameter}
              <output>{parameter}</output>
            </label>
            <input
              id="geometry"
              type="range"
              min={study.min}
              max={study.max}
              value={parameter}
              onChange={(e) => setParameter(Number(e.target.value))}
            />
            <label className="guide-toggle">
              <span>Construction guides</span>
              <input
                type="checkbox"
                checked={guides}
                onChange={(e) => setGuides(e.target.checked)}
              />
            </label>
            <p className="control-note">
              Small adjustments. New perspectives.
              <br />
              Take your time exploring.
            </p>
          </aside>
        </div>
        <div className="detail-bottom">
          <span>WITH MOTION, FORM BECOMES POSSIBILITY.</span>
          <Link to="/studies/$slug" params={{ slug: next.slug }}>
            Next study: {next.title} <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </>
  )
}
