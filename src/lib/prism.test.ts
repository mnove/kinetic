import { expect, it } from "vitest"
import {
  lampDistance,
  lampPose,
  maxRayPoints,
  prismVertices,
  refractiveIndex,
  restingBeamAngle,
  screenX,
  spectrumCount,
  traceRay,
  wavelength,
} from "./prism"

const vertices = new Float64Array(6),
  points = new Float64Array(maxRayPoints * 2)
// Aims at a fraction of the way down the left face, tilted from rest.
function launch(apex: number, tilt: number, nanometres: number, along = 0.5) {
  const angle = restingBeamAngle(apex) + tilt,
    dx = Math.cos(angle),
    dy = Math.sin(angle)
  prismVertices(apex, 235, 125, vertices)
  const ox = vertices[0] + (vertices[4] - vertices[0]) * along - dx * 150,
    oy = vertices[1] + (vertices[5] - vertices[1]) * along - dy * 150
  const count = traceRay(
    vertices,
    refractiveIndex(nanometres),
    ox,
    oy,
    dx,
    dy,
    points
  )
  return { count, angle }
}
const heading = (k: number) =>
  Math.atan2(
    points[k * 2 + 3] - points[k * 2 + 1],
    points[k * 2 + 2] - points[k * 2]
  )

it("slows violet light more than red", () => {
  expect(refractiveIndex(400)).toBeGreaterThan(refractiveIndex(550))
  expect(refractiveIndex(550)).toBeGreaterThan(refractiveIndex(700))
  expect(wavelength(0)).toBe(400)
  expect(wavelength(spectrumCount - 1)).toBe(700)
})

it("bends at each face by Snell's law and rests at minimum deviation", () => {
  for (const apex of [30, 45, 60, 65]) {
    const { count, angle } = launch(apex, 0, 550)
    expect(count).toBe(4)
    const n = refractiveIndex(550),
      half = (apex * Math.PI) / 360
    // Symmetric passage: the ray inside runs parallel to the base.
    expect(heading(1)).toBeCloseTo(0, 9)
    expect(heading(2) - angle).toBeCloseTo(
      2 * Math.asin(n * Math.sin(half)) - (apex * Math.PI) / 180,
      9
    )
    for (const tilt of [-0.2, 0.07, 0.1]) {
      launch(apex, tilt, 550, 0.4)
      // Left face normal points left and up; angles measured against it.
      const face = Math.atan2(
        vertices[5] - vertices[1],
        vertices[4] - vertices[0]
      )
      const incident = heading(0) - face,
        refracted = heading(1) - face
      expect(Math.cos(incident)).toBeCloseTo(n * Math.cos(refracted), 9)
    }
  }
})

it("fans the colours across the screen and traps violet first at wide apex angles", () => {
  for (const apex of [30, 60]) {
    let previous = -Infinity
    for (let i = 0; i < spectrumCount; i++) {
      const { count } = launch(apex, -0.2, wavelength(i))
      expect(points[(count - 1) * 2]).toBeCloseTo(screenX, 9)
      const y = points[(count - 1) * 2 + 1]
      // Screen y grows downward: red, bent least, lands highest.
      if (i) expect(y).toBeLessThan(previous)
      previous = y
    }
  }
  const trapped = (nanometres: number) => launch(62, 0.2, nanometres).count
  expect(trapped(400)).toBeGreaterThan(4)
  expect(trapped(700)).toBe(4)
})

it("retraces its path when the exit ray is reversed", () => {
  const { count } = launch(55, -0.13, 480, 0.6)
  const end = (count - 1) * 2,
    first = points.slice(0, 4)
  const back = Math.atan2(
    points[end - 1] - points[end + 1],
    points[end - 2] - points[end]
  )
  traceRay(
    vertices,
    refractiveIndex(480),
    points[end],
    points[end + 1],
    Math.cos(back),
    Math.sin(back),
    points
  )
  const final = Math.atan2(points[7] - points[5], points[6] - points[4])
  expect(points[4]).toBeCloseTo(first[2], 6)
  expect(points[5]).toBeCloseTo(first[3], 6)
  expect(
    Math.cos(final - Math.atan2(first[1] - first[3], first[0] - first[2]))
  ).toBeCloseTo(1, 9)
})

it("keeps the swinging lamp on the canvas and its beam on the left face", () => {
  const lamp = { x: 0, y: 0, angle: 0 }
  for (const apex of [30, 55, 65]) {
    prismVertices(apex, 235, 125, vertices)
    for (let time = 0; time < 120; time += 0.37) {
      lampPose(apex, time, vertices, lamp)
      expect(lamp.x).toBeGreaterThan(30)
      expect(lamp.y).toBeGreaterThan(30)
      expect(lamp.y).toBeLessThan(390)
      traceRay(
        vertices,
        refractiveIndex(550),
        lamp.x,
        lamp.y,
        Math.cos(lamp.angle),
        Math.sin(lamp.angle),
        points
      )
      const along =
        Math.hypot(points[2] - vertices[0], points[3] - vertices[1]) /
        Math.hypot(vertices[4] - vertices[0], vertices[5] - vertices[1])
      expect(along).toBeGreaterThanOrEqual(0.4 - 1e-9)
      expect(along).toBeLessThanOrEqual(0.6 + 1e-9)
      expect(Math.hypot(points[2] - lamp.x, points[3] - lamp.y)).toBeCloseTo(
        lampDistance,
        9
      )
    }
  }
})
