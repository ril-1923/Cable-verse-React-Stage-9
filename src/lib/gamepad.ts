/** Reads the first connected controller (standard layout) with dead zones applied. */
export interface PadFrame {
  name: string
  lx: number
  ly: number
  rx: number
  ry: number
  zoom: number // right trigger minus left trigger
  pressed: boolean[] // by standard button index
}

// standard layout button indices
export const BTN = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, L3: 10, R3: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
} as const

const DEAD = 0.18
const dead = (v: number) => {
  const a = Math.abs(v)
  return a < DEAD ? 0 : Math.sign(v) * ((a - DEAD) / (1 - DEAD))
}

export function readPad(): PadFrame | null {
  const pads = typeof navigator !== 'undefined' ? navigator.getGamepads?.() : null
  if (!pads) return null
  for (const p of pads) {
    if (!p || !p.connected) continue
    const b = p.buttons
    return {
      name: p.id,
      lx: dead(p.axes[0] ?? 0),
      ly: dead(p.axes[1] ?? 0),
      rx: dead(p.axes[2] ?? 0),
      ry: dead(p.axes[3] ?? 0),
      zoom: (b[BTN.RT]?.value ?? 0) - (b[BTN.LT]?.value ?? 0),
      pressed: Array.from({ length: 17 }, (_, i) => !!b[i] && (b[i].pressed || b[i].value > 0.55)),
    }
  }
  return null
}
