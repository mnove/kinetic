import { expect, it } from "vitest"
import {
  peaucellierAngle,
  peaucellierArm,
  peaucellierCrank,
  peaucellierLine,
  peaucellierPower,
  peaucellierSide,
  peaucellierSwing,
  updatePeaucellier,
} from "./peaucellier"

const state = {
  cx: 0,
  px: 0,
  py: 0,
  ax: 0,
  ay: 0,
  bx: 0,
  by: 0,
  qx: 0,
  qy: 0,
}

it("keeps every bar rigid across the full swing and slider range", () => {
  for (const offset of [-20, -7, 0, 11, 20])
    for (let a = -peaucellierSwing; a <= peaucellierSwing; a += 0.05) {
      updatePeaucellier(state, a, offset)
      expect(Math.hypot(state.px - state.cx, state.py)).toBeCloseTo(
        peaucellierCrank,
        10
      )
      expect(Math.hypot(state.ax, state.ay)).toBeCloseTo(peaucellierArm, 10)
      expect(Math.hypot(state.bx, state.by)).toBeCloseTo(peaucellierArm, 10)
      for (const [x, y] of [
        [state.px, state.py],
        [state.qx, state.qy],
      ]) {
        expect(Math.hypot(state.ax - x, state.ay - y)).toBeCloseTo(
          peaucellierSide,
          10
        )
        expect(Math.hypot(state.bx - x, state.by - y)).toBeCloseTo(
          peaucellierSide,
          10
        )
      }
      // The rhombus never collapses into a flat, singular pose.
      expect(
        Math.hypot(state.ax - state.bx, state.ay - state.by)
      ).toBeGreaterThan(80)
    }
})

it("inverts P through O, so the pen stays collinear at the fixed power", () => {
  for (const offset of [-20, 0, 20])
    for (let a = -peaucellierSwing; a <= peaucellierSwing; a += 0.05) {
      updatePeaucellier(state, a, offset)
      expect(state.px * state.qy - state.py * state.qx).toBeCloseTo(0, 8)
      expect(state.px * state.qx + state.py * state.qy).toBeGreaterThan(0)
      expect(
        Math.hypot(state.px, state.py) * Math.hypot(state.qx, state.qy)
      ).toBeCloseTo(peaucellierPower, 8)
    }
})

it("draws an exact straight line only when the crank circle passes through O", () => {
  for (let a = -peaucellierSwing; a <= peaucellierSwing; a += 0.05) {
    updatePeaucellier(state, a, 0)
    expect(state.qx).toBeCloseTo(peaucellierLine, 10)
  }
  for (const offset of [-20, 20]) {
    updatePeaucellier(state, 0, offset)
    const middle = state.qx
    updatePeaucellier(state, peaucellierSwing, offset)
    expect(Math.abs(state.qx - middle)).toBeGreaterThan(5)
  }
})

it("swings the crank symmetrically and closes the loop", () => {
  const period = (Math.PI * 2) / 0.7
  for (let t = 0; t < 20; t += 0.1) {
    expect(Math.abs(peaucellierAngle(t))).toBeLessThanOrEqual(peaucellierSwing)
    expect(peaucellierAngle(t + period)).toBeCloseTo(peaucellierAngle(t), 10)
  }
})
