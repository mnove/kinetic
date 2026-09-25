import { expect, it } from "vitest"
import { BufferAttribute, Mesh, LineSegments } from "three"
import { createStudyScene, spatialKinds } from "./scenes"

it("builds finite, depth-tested geometry at parameter extremes and disposes it", () => {
  const ranges = {
    mobius: [25, 100],
    gyroscope: [10, 80],
    rollingwave: [18, 42],
    rollingcube: [3, 12],
    tesseract: [4, 10],
    triangle: [20, 75],
    miura: [10, 60],
    gravity: [40, 100],
  }
  for (const kind of spatialKinds)
    for (const parameter of ranges[kind]) {
      const scene = createStudyScene(kind, parameter, true)
      let released = 0,
        geometries = 0
      scene.group.traverse((object) => {
        if (object instanceof Mesh || object instanceof LineSegments) {
          geometries++
          object.geometry.addEventListener("dispose", () => released++)
        }
      })
      for (const t of [0, 1, 4, 9, 20]) {
        scene.update(t)
        scene.group.updateMatrixWorld(true)
        scene.group.traverse((object) => {
          expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true)
          if (object instanceof Mesh || object instanceof LineSegments) {
            const positions = object.geometry.getAttribute("position")
            if (positions instanceof BufferAttribute)
              expect(Array.from(positions.array).every(Number.isFinite)).toBe(
                true
              )
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material]
            materials.forEach((material) =>
              expect(material.depthTest).toBe(true)
            )
          }
        })
      }
      scene.dispose()
      expect(released).toBe(geometries)
      expect(scene.group.children).toHaveLength(0)
    }
})
