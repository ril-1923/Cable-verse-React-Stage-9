/** Controller rumble. Does nothing without a controller that supports it. */
export function rumble(ms = 120, strong = 0.5, weak = 0.5) {
  try {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find((p) => p && p.connected)
    const act = (pad as unknown as { vibrationActuator?: { playEffect?: (t: string, o: object) => Promise<unknown> } } | undefined)?.vibrationActuator
    void act?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak })
  } catch {
    // rumble is a nicety, never an error
  }
}
