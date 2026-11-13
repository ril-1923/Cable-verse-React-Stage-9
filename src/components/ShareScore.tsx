import { useEffect, useMemo, useRef, useState } from 'react'
import { GOALS, game, score, stars } from '../lib/game'
import { SEASONS, seasonIndex, seasonPos } from '../lib/seasons'
import { CARD_H, CARD_W, cardText, drawCard } from '../lib/scorecard'
import type { CardData } from '../lib/scorecard'
import { skinById } from '../lib/skins'
import { useDialog } from '../lib/useDialog'
import { rankOf, useLeaderboard } from '../store/useLeaderboard'
import { useUi } from '../store/useUi'

/** Builds a score card image you can download, copy or send. */
export function ShareScore() {
  const open = useUi((s) => s.shareOpen)
  const setOpen = useUi((s) => s.setShareOpen)
  const backdrop = useUi((s) => s.backdrop)
  const name = useLeaderboard((s) => s.name)
  const runs = useLeaderboard((s) => s.runs)
  const [withScene, setWithScene] = useState(true)
  const [showName, setShowName] = useState(true)
  const [status, setStatus] = useState('')
  const [data, setData] = useState<CardData | null>(null)

  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  useDialog(open, () => setOpen(false), box, closeRef)

  // freeze the numbers when the dialog opens, and ask the scene for a snapshot
  useEffect(() => {
    if (!open) return
    const season = SEASONS[seasonIndex(seasonPos(game.day, game.dayHours))]
    setData({
      name: name || 'Player',
      score: score(),
      days: Math.max(0, game.day - 1),
      pax: game.totalPax,
      stars: stars(),
      cash: Math.round(game.cash),
      goals: game.goalsDone,
      goalTotal: GOALS.length,
      rank: rankOf(runs, score()),
      season: season.name,
      skin: [...skinById(game.skin).bodies],
    })
    setStatus('')
    useUi.getState().setBackdrop(null)
    useUi.getState().requestSnap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open && data && canvas.current) drawCard(canvas.current, data, withScene ? backdrop : null, showName)
  }, [open, data, withScene, showName, backdrop])

  const text = useMemo(() => (data ? cardText(data) : ''), [data])
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const toBlob = () =>
    new Promise<Blob | null>((res) => {
      const c = canvas.current
      if (!c) return res(null)
      c.toBlob(res, 'image/png')
    })

  const download = async () => {
    const blob = await toBlob()
    if (!blob) return setStatus('Could not create the image.')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cableverse-score-${data?.score ?? 0}.png`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    setStatus('Image saved.')
  }

  const copyImage = async () => {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob().then((b) => b ?? new Blob()) })])
      setStatus('Image copied. Paste it anywhere.')
    } catch {
      setStatus("This browser can't copy images. Use Save image instead.")
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('Text copied.')
    } catch {
      setStatus("Couldn't copy. Select the text below and copy it yourself.")
    }
  }

  const share = async () => {
    try {
      const blob = await toBlob()
      const file = blob ? new File([blob], 'cableverse-score.png', { type: 'image/png' }) : null
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text })
      else await navigator.share({ text })
      setStatus('Shared.')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('Sharing did not work here. Try Save image or Copy text.')
    }
  }

  if (!open) return null

  return (
    <div className="overlay settings-wrap" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="settings wide" role="dialog" aria-modal="true" aria-labelledby="share-title" ref={box}>
        <header>
          <h2 id="share-title">📤 Share your score</h2>
          <button ref={closeRef} className="secondary" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </header>

        <canvas
          ref={canvas}
          className="card-preview"
          width={CARD_W}
          height={CARD_H}
          role="img"
          aria-label={data ? `Score card: ${data.score} points, ${data.days} days, ${data.pax} passengers` : 'Score card'}
        />

        <div className="row wrap">
          <label className="check">
            <input type="checkbox" checked={withScene} onChange={(e) => setWithScene(e.target.checked)} />
            Use a picture of my mountain
          </label>
          <label className="check">
            <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
            Show my name
          </label>
        </div>

        <div className="row wrap">
          <button onClick={download}>⬇ Save image</button>
          <button className="secondary" onClick={copyImage}>Copy image</button>
          <button className="secondary" onClick={copyText}>Copy text</button>
          {canShare && <button className="secondary" onClick={share}>Share…</button>}
        </div>

        <p className="share-text" aria-label="Text version">{text}</p>
        <p className="muted" role="status">{status}</p>
      </div>
    </div>
  )
}
