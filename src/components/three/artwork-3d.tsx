import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrthographicCamera } from "three"
import type { Group } from "three"
import { createStudyScene } from "./scenes"
import type { Scene, SpatialKind } from "./scenes"
import type { ReactNode } from "react"
import type { Study } from "@/lib/studies"

type Props = {
  study: Study
  playing?: boolean
  speed?: number
  parameter?: number
  guides?: boolean
  reset?: number
  fallback: ReactNode
}
class RendererBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
function StudyScene({
  kind,
  parameter,
  guides,
  time,
  playing,
  speed,
  reset,
}: {
  kind: SpatialKind
  parameter: number
  guides: boolean
  time: { current: number }
  playing: boolean
  speed: number
  reset: number
}) {
  const parent = useRef<Group>(null)
  const scene = useRef<Scene | null>(null)
  const { camera, size, invalidate } = useThree()
  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera) {
      camera.zoom = size.width / 6
      camera.updateProjectionMatrix()
    }
    invalidate()
  }, [camera, size.width, invalidate])
  useLayoutEffect(() => {
    const built = createStudyScene(kind, parameter, guides)
    scene.current = built
    built.update(time.current)
    const container = parent.current
    container?.add(built.group)
    invalidate()
    return () => {
      container?.remove(built.group)
      built.dispose()
      scene.current = null
    }
  }, [kind, parameter, guides, time, invalidate])
  useLayoutEffect(() => {
    invalidate()
  }, [reset, time, invalidate])
  useFrame((_, delta) => {
    if (playing) time.current += Math.min(delta, 0.05) * speed
    scene.current?.update(time.current)
  })
  return <group ref={parent} />
}
function ContextWatch({
  onLost,
  onRestored,
}: {
  onLost: () => void
  onRestored: () => void
}) {
  const { gl, invalidate } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    // preventDefault asks the browser to restore the context, so pair it with a
    // restore listener; otherwise a transient loss retires the canvas forever.
    const lost = (event: Event) => {
      event.preventDefault()
      onLost()
    }
    const restored = () => {
      onRestored()
      invalidate()
    }
    canvas.addEventListener("webglcontextlost", lost)
    canvas.addEventListener("webglcontextrestored", restored)
    return () => {
      canvas.removeEventListener("webglcontextlost", lost)
      canvas.removeEventListener("webglcontextrestored", restored)
    }
  }, [gl, invalidate, onLost, onRestored])
  return null
}
export default function Artwork3D({
  study,
  playing = true,
  speed = 1,
  parameter = study.initial,
  guides = true,
  reset = 0,
  fallback,
}: Props) {
  const element = useRef<HTMLDivElement>(null)
  const time = useRef(0)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(true)
  const [lost, setLost] = useState(false)
  const markLost = useCallback(() => setLost(true), [])
  const markRestored = useCallback(() => setLost(false), [])
  useLayoutEffect(() => {
    time.current = 0
  }, [reset])
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(motion.matches)
    sync()
    motion.addEventListener("change", sync)
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px" }
    )
    if (element.current) observer.observe(element.current)
    return () => {
      motion.removeEventListener("change", sync)
      observer.disconnect()
    }
  }, [])
  return (
    <RendererBoundary fallback={fallback}>
      <div
        className="artwork webgl-artwork"
        ref={element}
        role="img"
        aria-label={`${study.title}: ${study.subtitle}`}
      >
        {/* While lost, show the 2D fallback but keep the Canvas mounted and
            hidden: unmounting it would destroy the context that is due to fire
            webglcontextrestored. */}
        {lost && fallback}
        {visible && (
          <Canvas
            orthographic
            camera={{ position: [0, 0, 8], near: 0.1, far: 100 }}
            dpr={[1, 1.75]}
            frameloop={playing && !reduced ? "always" : "demand"}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            fallback={fallback}
            style={lost ? { display: "none" } : undefined}
          >
            <ContextWatch onLost={markLost} onRestored={markRestored} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[-3, 5, 6]} intensity={2.2} />
            <directionalLight position={[4, -2, 2]} intensity={0.6} />
            <StudyScene
              kind={study.kind as SpatialKind}
              parameter={parameter}
              guides={guides}
              time={time}
              playing={playing && !reduced}
              speed={speed}
              reset={reset}
            />
          </Canvas>
        )}
      </div>
    </RendererBoundary>
  )
}
