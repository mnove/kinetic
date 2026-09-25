import { artAccents } from "@/lib/art-palette"
import * as THREE from "three"
import { mobiusPoint } from "@/lib/kinetic-math"
import { rollingCube } from "@/lib/rolling-cube"
import { tesseractEdges, tesseractVertices } from "@/lib/geometric-studies"
import { miuraColumns, miuraRows, updateMiura } from "@/lib/new-studies"
import {
  createWell,
  wellBodies,
  wellDepth,
  wellRadius,
} from "@/lib/gravity-well"

export const spatialKinds = [
  "mobius",
  "gyroscope",
  "rollingwave",
  "rollingcube",
  "tesseract",
  "triangle",
  "miura",
  "gravity",
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
  if (kind === "gravity") {
    group.rotation.x = 0.8
    group.position.y = 15
    const well = createWell()
    well.prepare(parameter)
    const rings = 24,
      spokes = 48
    const surface: number[] = [],
      indices: number[] = [],
      grid: number[] = []
    const vertex = (r: number, a: number) => [
      r * Math.cos(a),
      -wellDepth(r, parameter),
      r * Math.sin(a),
    ]
    for (let j = 0; j <= rings; j++)
      for (let i = 0; i <= spokes; i++)
        surface.push(
          ...vertex(wellRadius * (j / rings) ** 1.6, (i / spokes) * Math.PI * 2)
        )
    for (let j = 0; j < rings; j++)
      for (let i = 0; i < spokes; i++) {
        const a = j * (spokes + 1) + i,
          b = a + spokes + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(surface, 3)
    )
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const sheet = mesh(group, geometry, "#d2d2d2")
    // Pushed back so the grid drawn on the same surface never z-fights it.
    Object.assign(sheet.material, {
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    for (let k = 1; k <= 10; k++)
      for (let i = 0; i < 72; i++)
        grid.push(
          ...vertex((k / 10) * wellRadius, (i / 72) * Math.PI * 2),
          ...vertex((k / 10) * wellRadius, ((i + 1) / 72) * Math.PI * 2)
        )
    for (let k = 0; k < 24; k++)
      for (let i = 0; i < 32; i++)
        grid.push(
          ...vertex(wellRadius * (i / 32) ** 1.6, (k / 24) * Math.PI * 2),
          ...vertex(wellRadius * ((i + 1) / 32) ** 1.6, (k / 24) * Math.PI * 2)
        )
    lines(group, grid, "#8f8f8f")
    const core = mesh(
      group,
      new THREE.SphereGeometry(4 + parameter * 0.07, 20, 14),
      "#4d4d4d"
    )
    core.position.y = -wellDepth(0, parameter) + 4 + parameter * 0.07
    if (guides) {
      const orbitRings: number[] = []
      for (const r of [wellBodies[0].radius, well.periapses[0]])
        for (let i = 0; i < 72; i++)
          orbitRings.push(
            ...vertex(r, (i / 72) * Math.PI * 2),
            ...vertex(r, ((i + 1) / 72) * Math.PI * 2)
          )
      lines(group, orbitRings, artAccents.gold)
      lines(group, [0, 30, 0, 0, -wellDepth(0, parameter), 0], "#a9a9a9")
    }
    const colors = [artAccents.gold, artAccents.blue, artAccents.violet],
      trail = 110,
      point = { x: 0, y: 0, r: 0 }
    const bodies = wellBodies.map((_, body) => {
      const sphere = mesh(
        group,
        new THREE.SphereGeometry(6, 16, 12),
        colors[body]
      )
      const positions = new Float32Array(trail * 6)
      const path = new THREE.BufferGeometry()
      path.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      group.add(
        new THREE.LineSegments(
          path,
          new THREE.LineBasicMaterial({ color: colors[body] })
        )
      )
      return { sphere, path, positions }
    })
    update = (time) => {
      bodies.forEach(({ sphere, path, positions }, body) => {
        for (let i = 0; i <= trail; i++) {
          well.sample(body, time - (trail - i) * 0.03, point)
          const y = -wellDepth(point.r, parameter) + 1
          // Each sample ends one segment and starts the next.
          for (
            let k = Math.max(0, i * 2 - 1);
            k <= Math.min(i * 2, trail * 2 - 1);
            k++
          ) {
            positions[k * 3] = point.x
            positions[k * 3 + 1] = y
            positions[k * 3 + 2] = point.y
          }
        }
        sphere.position.set(
          point.x,
          -wellDepth(point.r, parameter) + 6,
          point.y
        )
        path.attributes.position.needsUpdate = true
        path.computeBoundingSphere()
      })
    }
  } else if (kind === "miura") {
    group.rotation.set(-0.8, 0.18, -0.12)
    const points = new Float32Array((miuraColumns + 1) * (miuraRows + 1) * 3)
    const panels = new Float32Array(miuraColumns * miuraRows * 18)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(panels, 3))
    mesh(group, geometry, "#b8c9d2")
    const edgePoints = new Float32Array(
      (miuraColumns * (miuraRows + 1) + miuraRows * (miuraColumns + 1)) * 6
    )
    const edgeGeometry = new THREE.BufferGeometry()
    edgeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(edgePoints, 3)
    )
    const edges = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({ color: artAccents.blue })
    )
    edges.visible = guides
    group.add(edges)
    update = (time) => {
      updateMiura(points, time, parameter)
      let p = 0,
        e = 0
      for (let j = 0; j < miuraRows; j++)
        for (let i = 0; i < miuraColumns; i++) {
          const a = j * (miuraColumns + 1) + i,
            b = a + 1,
            c = b + miuraColumns + 1,
            d = c - 1
          for (let n = 0; n < 6; n++) {
            const vertex =
              n === 0 || n === 3 ? a : n === 1 ? b : n === 5 ? d : c
            for (let axis = 0; axis < 3; axis++)
              panels[p++] = points[vertex * 3 + axis]
          }
        }
      for (let j = 0; j <= miuraRows; j++)
        for (let i = 0; i <= miuraColumns; i++) {
          const a = j * (miuraColumns + 1) + i
          for (let direction = 0; direction < 2; direction++) {
            if (direction === 0 ? i === miuraColumns : j === miuraRows) continue
            const b = a + (direction === 0 ? 1 : miuraColumns + 1)
            for (let axis = 0; axis < 3; axis++)
              edgePoints[e++] = points[a * 3 + axis]
            for (let axis = 0; axis < 3; axis++)
              edgePoints[e++] = points[b * 3 + axis]
          }
        }
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
      edgeGeometry.attributes.position.needsUpdate = true
      edgeGeometry.computeBoundingSphere()
    }
  } else if (kind === "mobius") {
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
