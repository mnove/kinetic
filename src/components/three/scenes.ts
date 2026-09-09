import { artAccents } from "@/lib/art-palette"
import * as THREE from "three"
import { mobiusPoint } from "@/lib/kinetic-math"
import { rollingCube } from "@/lib/rolling-cube"
import { tesseractEdges, tesseractVertices } from "@/lib/geometric-studies"

export const spatialKinds = [
  "mobius",
  "gyroscope",
  "rollingwave",
  "rollingcube",
  "tesseract",
  "triangle",
] as const
export type SpatialKind = (typeof spatialKinds)[number]
export type Scene = {
  group: THREE.Group
  update: (time: number) => void
  dispose: () => void
}
function material(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.15,
    side: THREE.DoubleSide,
  })
}
function mesh(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  color: string
) {
  const result = new THREE.Mesh(geometry, material(color))
  parent.add(result)
  return result
}
function rod(
  parent: THREE.Group,
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  color: string
) {
  const result = mesh(
    parent,
    new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 12),
    color
  )
  result.position.copy(a).add(b).multiplyScalar(0.5)
  result.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    b.clone().sub(a).normalize()
  )
  return result
}
function torus(
  parent: THREE.Group,
  radius: number,
  tube: number,
  color: string,
  xz = false
) {
  const result = mesh(
    parent,
    new THREE.TorusGeometry(radius, tube, 10, 100),
    color
  )
  if (xz) result.rotation.x = Math.PI / 2
  return result
}
function lines(parent: THREE.Group, positions: number[], color: string) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  const result = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color })
  )
  parent.add(result)
  return result
}
function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>()
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry)
      for (const m of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(m)
    }
  })
  geometries.forEach((g) => g.dispose())
  materials.forEach((m) => m.dispose())
  group.clear()
}
export function createStudyScene(
  kind: SpatialKind,
  parameter: number,
  guides: boolean
): Scene {
  const root = new THREE.Group()
  root.scale.setScalar(0.01)
  const group = new THREE.Group()
  root.add(group)
  let update: (time: number) => void = () => {}
  if (kind === "mobius") {
    group.rotation.x = 1
    const geometry = new THREE.BufferGeometry(),
      positions: number[] = [],
      indices: number[] = []
    const segments = 256,
      rows = 20
    for (let i = 0; i <= segments; i++)
      for (let j = 0; j <= rows; j++) {
        const p = mobiusPoint(
          (i / segments) * Math.PI * 2,
          (j / rows - 0.5) * parameter
        )
        positions.push(p.x, p.y, p.z)
      }
    for (let i = 0; i < segments; i++)
      for (let j = 0; j < rows; j++) {
        const a = i * (rows + 1) + j,
          b = a + rows + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    )
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    mesh(group, geometry, "#9b9b9b")
    if (guides) {
      const edges: number[] = []
      for (let i = 0; i < segments; i++)
        for (const v of [-parameter / 2, parameter / 2]) {
          for (const u of [
            (i / segments) * Math.PI * 2,
            ((i + 1) / segments) * Math.PI * 2,
          ]) {
            const p = mobiusPoint(u, v)
            edges.push(p.x, p.y, p.z)
          }
        }
      lines(group, edges, "#585858")
    }
    const markerGeometry = new THREE.BufferGeometry()
    const markerPositions = new Float32Array(48 * 9)
    markerGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(markerPositions, 3)
    )
    const marker = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshBasicMaterial({
        color: artAccents.red,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      })
    )
    group.add(marker)
    update = (time) => {
      group.rotation.z = time * 0.18 + 0.3
      const travel = time * 0.65,
        v = parameter * 0.29,
        r = Math.min(5.5, parameter * 0.18)
      const center = mobiusPoint(travel, v)
      for (let i = 0; i < 48; i++) {
        const points = [
          center,
          ...[i, i + 1].map((k) => {
            const a = (k / 48) * Math.PI * 2
            return mobiusPoint(
              travel + (Math.cos(a) * r) / 112,
              v + Math.sin(a) * r
            )
          }),
        ]
        points.forEach((p, k) =>
          markerPositions.set([p.x, p.y, p.z], i * 9 + k * 3)
        )
      }
      markerGeometry.attributes.position.needsUpdate = true
      markerGeometry.computeBoundingSphere()
    }
  } else if (kind === "gyroscope") {
    group.rotation.x = 0.38
    torus(group, 145, 2.5, "#959595", true)
    const middle = new THREE.Group()
    group.add(middle)
    torus(middle, 124, 3, "#656565")
    const inner = new THREE.Group()
    middle.add(inner)
    inner.rotation.x = (parameter * Math.PI) / 180
    torus(inner, 101, 2.5, "#868686", true)
    for (const sign of [-1, 1]) {
      rod(
        middle,
        new THREE.Vector3(124 * sign, 0, 0),
        new THREE.Vector3(145 * sign, 0, 0),
        3,
        "#747474"
      )
      rod(
        inner,
        new THREE.Vector3(101 * sign, 0, 0),
        new THREE.Vector3(124 * sign, 0, 0),
        3,
        "#747474"
      )
    }
    rod(
      inner,
      new THREE.Vector3(0, 0, -101),
      new THREE.Vector3(0, 0, 101),
      2.5,
      "#616161"
    )
    const rotor = new THREE.Group()
    inner.add(rotor)
    torus(rotor, 73, 5, artAccents.gold)
    torus(rotor, 12, 3, "#777777")
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      rod(
        rotor,
        new THREE.Vector3(12 * Math.cos(a), 12 * Math.sin(a), 0),
        new THREE.Vector3(70 * Math.cos(a), 70 * Math.sin(a), 0),
        1.6,
        i === 0 ? "#c2c2c2" : "#8e8e8e"
      )
    }
    if (guides) lines(group, [0, -165, 0, 0, 165, 0], "#a9a9a9")
    update = (time) => {
      middle.rotation.y = time * 0.24 + 0.4
      rotor.rotation.z = time * 3.2
    }
  } else if (kind === "rollingwave") {
    group.rotation.x = 0.99
    const hinges: THREE.Group[] = []
    const count = Math.round(parameter),
      halfWidth = Math.min(7, ((Math.PI * 88) / count) * 0.65)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2,
        front = (1 + Math.sin(angle)) / 2
      const base = new THREE.Group()
      base.position.set(88 * Math.cos(angle), 2, 88 * Math.sin(angle))
      base.rotation.y = -angle
      group.add(base)
      const hinge = new THREE.Group()
      base.add(hinge)
      hinges.push(hinge)
      const top = new THREE.Color().setRGB(
        (64 - 12 * front) / 255,
        (64 - 12 * front) / 255,
        (64 - 12 * front) / 255,
        THREE.SRGBColorSpace
      )
      const dark = material("#242424"),
        cap = material(artAccents.blue),
        face = material("#ffffff")
      face.color.copy(top)
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(88, 13, halfWidth * 2),
        [cap, dark, face, dark, dark, dark]
      )
      block.position.set(44, 6.5, 0)
      hinge.add(block)
    }
    if (guides) torus(group, 88, 0.3, "#474747", true)
    update = (time) =>
      hinges.forEach((hinge, i) => {
        hinge.rotation.z =
          Math.pow(
            (1 + Math.cos((i / count) * Math.PI * 2 - time * 0.85 + 2.2)) / 2,
            7
          ) * 1.65
      })
  } else if (kind === "rollingcube" || kind === "tesseract") {
    const wire = lines(
      group,
      [],
      kind === "rollingcube" ? "#636363" : "#646464"
    )
    const links = lines(group, [], artAccents.blue)
    group.rotation.set(0.38, -0.6, 0)
    const put = (target: THREE.LineSegments, positions: number[]) => {
      const attribute = target.geometry.getAttribute("position")
      if (
        attribute instanceof THREE.BufferAttribute &&
        attribute.array.length === positions.length
      ) {
        attribute.copyArray(positions)
        attribute.needsUpdate = true
      } else
        target.geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3)
        )
      target.geometry.computeBoundingSphere()
    }
    if (kind === "rollingcube") {
      const marker = mesh(
        group,
        new THREE.SphereGeometry(3.5, 12, 8),
        artAccents.blue
      )
      update = (time) => {
        const slices = rollingCube(time, parameter),
          positions: number[] = []
        const edge = (a: (typeof slices)[number][number], b: typeof a) =>
          positions.push(
            a.x * 66,
            (a.y - 1) * 66,
            a.z * 66,
            b.x * 66,
            (b.y - 1) * 66,
            b.z * 66
          )
        slices.forEach((slice, i) => {
          slice.forEach((p, k) => edge(p, slice[(k + 1) % 4]))
          if (
            i > 0 &&
            slice.every(
              (p, k) =>
                Math.hypot(p.x - slices[i - 1][k].x, p.y - slices[i - 1][k].y) <
                1e-7
            )
          )
            slice.forEach((p, k) => edge(p, slices[i - 1][k]))
        })
        const point = slices[0][0]
        marker.position.set(point.x * 66, (point.y - 1) * 66, point.z * 66)
        put(wire, positions)
      }
    } else {
      update = (time) => {
        const points = tesseractVertices(time).map(([x, y, z, w]) => {
          const scale = (parameter / (parameter - w)) * 63
          return [x * scale, y * scale, z * scale]
        })
        const edges: number[] = [],
          connections: number[] = []
        tesseractEdges.forEach(([a, b]) =>
          ((a ^ b) === 8 ? connections : edges).push(...points[a], ...points[b])
        )
        put(wire, edges)
        put(links, connections)
      }
    }
    if (guides)
      lines(group, [-170, 0, 0, 170, 0, 0, 0, -150, 0, 0, 150, 0], "#ababab")
  } else {
    const outer = [
        [0, 125],
        [125, -91],
        [-125, -91],
      ],
      inner = [
        [0, 66],
        [74, -61],
        [-74, -61],
      ]
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3,
        shape = [outer[i], outer[j], inner[j], inner[i]],
        depths = [-45, 45, 45, -45]
      const vertices = [
        ...shape.map((p, k) => [...p, depths[k] + 7]),
        ...shape.map((p, k) => [...p, depths[k] - 7]),
      ]
      const indices = [
        0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
        2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
      ]
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices.flat(), 3)
      )
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      mesh(group, geometry, ["#a9a9a9", artAccents.teal, "#c5c5c5"][i])
    }
    if (guides) lines(group, [-150, -120, 0, 150, -120, 0], "#a9a9a9")
    update = (time) => {
      group.rotation.y =
        (Math.pow(Math.sin(time * 0.22), 6) * parameter * Math.PI) / 180
    }
  }
  update(0)
  return { group: root, update, dispose: () => disposeGroup(root) }
}
