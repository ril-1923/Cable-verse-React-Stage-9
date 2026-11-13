export type Quality = 'low' | 'medium' | 'high' | 'ultra'

export interface QualityPreset {
  label: string
  blurb: string
  dpr: number // highest pixel ratio the renderer may use
  terrain: [number, number] // terrain mesh segments (x, z)
  trees: number // most trees drawn
  precip: number // share of rain and snow particles drawn
  halos: boolean // glow around the rope lamps
  stars: number
  bursts: number // fireworks bursts at once
  shadow: number // sun shadow map size, 0 = no shadows
}

export const QUALITY: Record<Quality, QualityPreset> = {
  low: { label: 'Low', blurb: 'Smoothest on older phones and laptops', dpr: 1, terrain: [110, 66], trees: 90, precip: 0.3, halos: false, stars: 1200, bursts: 3, shadow: 0 },
  medium: { label: 'Medium', blurb: 'A good balance for most devices', dpr: 1.25, terrain: [160, 96], trees: 220, precip: 0.6, halos: true, stars: 2200, bursts: 5, shadow: 1024 },
  high: { label: 'High', blurb: 'Full detail', dpr: 1.75, terrain: [220, 130], trees: 380, precip: 1, halos: true, stars: 3500, bursts: 8, shadow: 2048 },
  ultra: { label: 'Ultra', blurb: 'Sharpest picture, for strong graphics cards', dpr: 2, terrain: [300, 180], trees: 560, precip: 1, halos: true, stars: 5000, bursts: 8, shadow: 4096 },
}

export type ShadowChoice = 'auto' | 'off' | 'medium' | 'high'

/** Shadow map size for a preset, unless the player picked a shadow setting by hand. */
export function shadowMapSize(q: Quality, choice: ShadowChoice): number {
  if (choice === 'off') return 0
  if (choice === 'medium') return 2048
  if (choice === 'high') return 4096
  return QUALITY[q].shadow
}

export const QUALITY_ORDER: Quality[] = ['low', 'medium', 'high', 'ultra']
