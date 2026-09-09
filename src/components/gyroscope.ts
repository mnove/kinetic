import { artAccents } from "@/lib/art-palette"
import type { Vector3 } from "@/lib/kinetic-math"

// A kinematic gimbal study: prescribed precession and rotor spin, with every
// component transformed through its parent frame so the bearings stay joined.
export function drawGyroscope(
  ctx: CanvasRenderingContext2D,
  t: number,
  tiltDegrees: number,
  guides: boolean
) {
  const yaw = t * 0.24 + 0.4,
    tilt = (tiltDegrees * Math.PI) / 180
  const turn = (p: Vector3): Vector3 => ({
    x: p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
    y: p.y,
    z: -p.x * Math.sin(yaw) + p.z * Math.cos(yaw),
  })
  const lean = (p: Vector3): Vector3 => ({
    x: p.x,
    y: p.y * Math.cos(tilt) - p.z * Math.sin(tilt),
    z: p.y * Math.sin(tilt) + p.z * Math.cos(tilt),
  })
  const inner = (p: Vector3) => turn(lean(p))
  const project = (p: Vector3) => {
    const z = p.z * Math.cos(0.38) + p.y * Math.sin(0.38)
    const scale = 750 / (750 - z)
    return {
      x: 300 + p.x * scale,
      y: 210 - (p.y * Math.cos(0.38) - p.z * Math.sin(0.38)) * scale,
      z,
      scale,
    }
  }
  const items: Array<{ depth: number; paint: () => void }> = []
  const segment = (a: Vector3, b: Vector3, color: string, width: number) => {
    const p = project(a),
      q = project(b)
    items.push({
      depth: (p.z + q.z) / 2,
      paint: () => {
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
        ctx.strokeStyle = color
        ctx.lineWidth = (width * (p.scale + q.scale)) / 2
        ctx.stroke()
        if (width >= 5) {
          ctx.strokeStyle = "#ffffff35"
          ctx.lineWidth = 1
          ctx.stroke()
        }
      },
    })
  }
  const rod = (a: Vector3, b: Vector3, color: string, width: number) => {
    // Short segments prevent a long axle being sorted as one flat layer.
    for (let i = 0; i < 32; i++) {
      const point = (f: number) => ({
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        z: a.z + (b.z - a.z) * f,
      })
      segment(point(i / 32), point((i + 1) / 32), color, width)
    }
  }
  const ring = (
    radius: number,
    plane: "xy" | "xz",
    transform: (p: Vector3) => Vector3,
    color: string,
    width: number
  ) => {
    const point = (angle: number) =>
      transform({
        x: radius * Math.cos(angle),
        y: plane === "xy" ? radius * Math.sin(angle) : 0,
        z: plane === "xz" ? radius * Math.sin(angle) : 0,
      })
    for (let i = 0; i < 160; i++)
      segment(
        point((i / 160) * Math.PI * 2),
        point(((i + 1) / 160) * Math.PI * 2),
        color,
        width
      )
  }
  if (guides) {
    ctx.setLineDash([3, 5])
    ctx.strokeStyle = "#96969666"
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.moveTo(300, 43)
    ctx.lineTo(300, 373)
    ctx.stroke()
    ctx.setLineDash([])
    rod(
      inner({ x: 0, y: 0, z: -145 }),
      inner({ x: 0, y: 0, z: 145 }),
      "#a4a4a480",
      0.8
    )
  }
  ring(145, "xz", (p) => p, "#959595", 4)
  ring(124, "xy", turn, "#656565", 6)
  ring(101, "xz", inner, "#868686", 5)
  for (const sign of [-1, 1]) {
    rod(
      turn({ x: 124 * sign, y: 0, z: 0 }),
      turn({ x: 145 * sign, y: 0, z: 0 }),
      "#747474",
      6
    )
    rod(
      inner({ x: 101 * sign, y: 0, z: 0 }),
      inner({ x: 124 * sign, y: 0, z: 0 }),
      "#747474",
      6
    )
  }
  rod(
    inner({ x: 0, y: 0, z: -101 }),
    inner({ x: 0, y: 0, z: 101 }),
    "#616161",
    5
  )
  // Rotor annulus and its rotating spokes share the axle's local frame.
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2 + t * 3.2,
      b = ((i + 1) / 128) * Math.PI * 2 + t * 3.2
    const points = [
      { r: 68, a },
      { r: 78, a },
      { r: 78, a: b },
      { r: 68, a: b },
    ].map(({ r, a: angle }) =>
      project(inner({ x: r * Math.cos(angle), y: r * Math.sin(angle), z: 0 }))
    )
    items.push({
      depth: points.reduce((sum, p) => sum + p.z, 0) / 4,
      paint: () => {
        ctx.beginPath()
        points.forEach((p, k) =>
          k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
        )
        ctx.closePath()
        ctx.fillStyle = i % 16 < 3 ? "#b8b8b8" : artAccents.gold
        ctx.fill()
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = 0.6
        ctx.stroke()
      },
    })
  }
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t * 3.2
    rod(
      inner({ x: 12 * Math.cos(angle), y: 12 * Math.sin(angle), z: 0 }),
      inner({ x: 69 * Math.cos(angle), y: 69 * Math.sin(angle), z: 0 }),
      artAccents.gold,
      3
    )
  }
  ring(12, "xy", inner, "#777777", 5)
  items.sort((a, b) => a.depth - b.depth).forEach((item) => item.paint())
  if (guides) {
    ctx.font = "9px monospace"
    ctx.fillStyle = "#868686"
    ctx.textAlign = "center"
    ctx.fillText("SPIN / TILT / PRECESSION", 300, 368)
    ctx.textAlign = "start"
  }
}
