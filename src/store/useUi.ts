import { create } from 'zustand'

/** Open/closed state for the dialogs, plus the scene snapshot used on share cards. */
interface UiState {
  leaderboardOpen: boolean
  shareOpen: boolean
  snapN: number // bump to ask the scene for a snapshot
  backdrop: HTMLCanvasElement | null
  setLeaderboardOpen: (on: boolean) => void
  setShareOpen: (on: boolean) => void
  requestSnap: () => void
  setBackdrop: (c: HTMLCanvasElement | null) => void
}

export const useUi = create<UiState>((set) => ({
  leaderboardOpen: false,
  shareOpen: false,
  snapN: 0,
  backdrop: null,
  setLeaderboardOpen: (leaderboardOpen) => set({ leaderboardOpen }),
  setShareOpen: (shareOpen) => set({ shareOpen }),
  requestSnap: () => set((s) => ({ snapN: s.snapN + 1 })),
  setBackdrop: (backdrop) => set({ backdrop }),
}))
