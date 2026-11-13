export const CARD_W = 1200
export const CARD_H = 630

export interface CardData {
  name: string
  score: number
  days: number
  pax: number
  stars: number
  cash: number
  goals: number
  goalTotal: number
  rank: number | null
  season: string
  skin: string[] // four cabin colours
}

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: number) {
  const path = new Path2D()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    if (i) path.lineTo(x, y)
    else path.moveTo(x, y)
  }
  path.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fill(path)
  if (fill > 0) {
    ctx.save()
    ctx.clip(path)
    ctx.fillStyle = '#ffc233'
    ctx.fillRect(cx - r, cy - r, r * 2 * fill, r * 2) // full or half star
    ctx.restore()
  }
}

function spaced(ctx: CanvasRenderingContext2D, spacing: string) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in c) c.letterSpacing = spacing
}

/** Draws the shareable score card. The backdrop (a snapshot of the mountain) is optional. */
export function drawCard(canvas: HTMLCanvasElement, d: CardData, backdrop: HTMLCanvasElement | null, showName: boolean) {
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (backdrop) {
    ctx.drawImage(backdrop, 0, 0, CARD_W, CARD_H)
  } else {
    const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
    g.addColorStop(0, '#12233a')
    g.addColorStop(1, '#2b7079')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, CARD_W, CARD_H)
    // a simple mountain skyline when there is no snapshot
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.moveTo(380, CARD_H)
    ctx.lineTo(620, 250)
    ctx.lineTo(760, 400)
    ctx.lineTo(920, 190)
    ctx.lineTo(CARD_W, 420)
    ctx.lineTo(CARD_W, CARD_H)
    ctx.closePath()
    ctx.fill()
  }

  // darken the left side so the text is readable over any picture
  const shade = ctx.createLinearGradient(0, 0, CARD_W * 0.74, 0)
  shade.addColorStop(0, 'rgba(8,14,24,0.93)')
  shade.addColorStop(0.65, 'rgba(8,14,24,0.62)')
  shade.addColorStop(1, 'rgba(8,14,24,0)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.fillStyle = '#8fe3d8'
  ctx.font = `700 24px ${FONT}`
  spaced(ctx, '5px')
  ctx.fillText('CABLEVERSE 3D', 60, 78)
  spaced(ctx, '0px')

  if (showName) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 44px ${FONT}`
    let name = d.name
    while (ctx.measureText(name).width > 560 && name.length > 1) name = name.slice(0, -1)
    ctx.fillText(name, 60, 148)
  }

  ctx.fillStyle = '#9fb0c3'
  ctx.font = `600 22px ${FONT}`
  spaced(ctx, '4px')
  ctx.fillText('SCORE', 60, 214)
  spaced(ctx, '0px')

  ctx.fillStyle = '#ffd166'
  ctx.font = `800 132px ${FONT}`
  ctx.fillText(d.score.toLocaleString('en-US'), 54, 330)

  for (let i = 0; i < 5; i++) star(ctx, 80 + i * 56, 376, 22, Math.max(0, Math.min(1, d.stars - i)))

  const stats: [string, string][] = [
    ['DAYS', String(d.days)],
    ['PASSENGERS', d.pax.toLocaleString('en-US')],
    ['CASH', `$${d.cash.toLocaleString('en-US')}`],
    ['GOALS', `${d.goals}/${d.goalTotal}`],
    ['SEASON', d.season],
    ['RANK', d.rank ? `#${d.rank}` : '-'],
  ]
  stats.forEach(([label, value], i) => {
    const x = 60 + (i % 3) * 215
    const y = 452 + Math.floor(i / 3) * 80
    ctx.fillStyle = '#9fb0c3'
    ctx.font = `600 16px ${FONT}`
    spaced(ctx, '3px')
    ctx.fillText(label, x, y)
    spaced(ctx, '0px')
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 34px ${FONT}`
    ctx.fillText(value, x, y + 38)
  })

  // medal for the top three
  if (d.rank && d.rank <= 3) {
    const colours = ['#f5c542', '#cfd6dd', '#cd8a52']
    ctx.beginPath()
    ctx.arc(CARD_W - 110, 110, 56, 0, Math.PI * 2)
    ctx.fillStyle = colours[d.rank - 1]
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.stroke()
    ctx.fillStyle = '#1a2230'
    ctx.font = `800 56px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(String(d.rank), CARD_W - 110, 130)
    ctx.textAlign = 'left'
  }

  // cabin colours and a challenge
  d.skin.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(60 + i * 34, 596, 28, 14)
  })
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `600 20px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('Can you beat it?', CARD_W - 40, 606)
  ctx.textAlign = 'left'
}

export function cardText(d: CardData): string {
  const rank = d.rank ? ` (#${d.rank} on my board)` : ''
  return (
    `I scored ${d.score.toLocaleString('en-US')} on Cableverse 3D${rank}! ` +
    `${d.days} days, ${d.pax.toLocaleString('en-US')} passengers, ${d.stars}\u2605 rating, ` +
    `$${d.cash.toLocaleString('en-US')} cash, ${d.goals}/${d.goalTotal} goals. Can you beat it?`
  )
}
