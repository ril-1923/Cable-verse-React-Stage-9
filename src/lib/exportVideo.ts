import { seek } from './replay'
import { useReplay } from '../store/useReplay'

let recorder: MediaRecorder | null = null
let unsub: (() => void) | null = null

export const canExportVideo = () => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'

export function cancelExport() {
  unsub?.()
  unsub = null
  if (recorder && recorder.state !== 'inactive') {
    recorder.ondataavailable = null
    recorder.onstop = null
    recorder.stop()
  }
  recorder = null
  useReplay.setState({ exporting: false })
}

/** Plays the replay from the start while recording the 3D view, then downloads a WebM file. */
export function startExport(filename: string) {
  const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
  if (!canvas || !canExportVideo() || useReplay.getState().exporting) return
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
  if (!mime) return

  const chunks: Blob[] = []
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6_000_000 })
  recorder = rec
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    cancelExport()
  }

  seek(0)
  useReplay.setState({ playing: true, exporting: true })
  rec.start(500)

  // stop when the playback reaches the end
  unsub = useReplay.subscribe((s, prev) => {
    if (!s.on) return cancelExport()
    if (prev.playing && !s.playing && recorder && recorder.state === 'recording') {
      window.setTimeout(() => recorder?.state === 'recording' && recorder.stop(), 400) // let the last frames land
      unsub?.()
      unsub = null
    }
  })
}
