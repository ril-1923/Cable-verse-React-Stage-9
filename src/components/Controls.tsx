import { useRef } from 'react'
import { useDialog } from '../lib/useDialog'
import { useInput } from '../store/useInput'

const KEYS: [string, string][] = [
  ['Arrow keys', 'Orbit and tilt the camera'],
  ['W A S D', 'Pan across the mountain'],
  ['E / Q  or  Page Up / Down', 'Zoom in / out'],
  ['C', 'Back to the overview'],
  ['Space', 'Pause or resume (play or pause in a replay)'],
  ['R', 'Ride a cabin / leave it'],
  ['P', 'Photo mode'],
  ['V', 'Replay a day'],
  ['L', 'Leaderboard'],
  ['O', 'Settings'],
  ['- and =', 'Ticket price down / up'],
  ['[ and ]', 'Cabin capacity down / up'],
  [', and .', 'Simulation speed down / up'],
  ['1  2  3', 'Clear, rain or snow'],
  ['M', 'Sound on or off'],
  ['F', 'Full screen'],
  ['H  or  ?', 'This help'],
  ['Esc', 'Close a window, leave photo mode or a replay'],
]

const PAD: [string, string][] = [
  ['Left stick', 'Pan'],
  ['Right stick', 'Orbit and tilt (look around in a cabin)'],
  ['Triggers (RT / LT)', 'Zoom in / out'],
  ['A', 'Ride a cabin  ·  first choice on an event card'],
  ['X', 'Pause  ·  second choice on an event card'],
  ['B', 'Leave the cabin, close windows, exit modes'],
  ['Y', 'Photo mode'],
  ['LB / RB', 'Ticket price down / up'],
  ['D-pad left / right', 'Cabin capacity down / up'],
  ['D-pad up / down', 'Simulation speed up / down'],
  ['Start', 'Settings'],
  ['Back / Select', 'Leaderboard'],
  ['R3 (press right stick)', 'Back to the overview'],
  ['L3 (press left stick)', 'This help'],
  ['In windows', 'D-pad moves, A selects, B closes'],
  ['In photo mode', 'A shoots · D-pad up/down zooms, left/right time · LB/RB filter'],
  ['In a replay', 'A play/pause · D-pad left/right jumps · LB/RB speed'],
]

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table className="keys">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row"><kbd>{k}</kbd></th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Controls() {
  const open = useInput((s) => s.helpOpen)
  const setOpen = useInput((s) => s.setHelpOpen)
  const pad = useInput((s) => s.pad)
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog(open, () => setOpen(false), box, closeRef)

  if (!open) return null
  return (
    <div className="overlay settings-wrap" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="settings wide" role="dialog" aria-modal="true" aria-labelledby="controls-title" ref={box}>
        <header>
          <h2 id="controls-title">⌨ Controls</h2>
          <button ref={closeRef} className="secondary" onClick={() => setOpen(false)} aria-label="Close controls">✕</button>
        </header>
        <section>
          <h3>Keyboard</h3>
          <Table rows={KEYS} />
        </section>
        <section>
          <h3>Controller {pad ? '🎮 connected' : '(connect one to use it)'}</h3>
          <Table rows={PAD} />
        </section>
        <p className="muted">Everything is also reachable with Tab and Enter. Camera speed and vertical inversion are in Settings.</p>
      </div>
    </div>
  )
}
