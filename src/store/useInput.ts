import { create } from 'zustand'

/** Which input device was used last (to show matching hints), and the controls help dialog. */
interface InputState {
  pad: boolean // a controller is connected
  lastInput: 'keyboard' | 'gamepad' | 'pointer'
  helpOpen: boolean
  cameraReset: number // bump to send the camera back to the overview
  setPad: (on: boolean) => void
  setLast: (v: 'keyboard' | 'gamepad' | 'pointer') => void
  setHelpOpen: (on: boolean) => void
  resetCamera: () => void
}

export const useInput = create<InputState>((set, get) => ({
  pad: false,
  lastInput: 'pointer',
  helpOpen: false,
  cameraReset: 0,
  setPad: (pad) => set({ pad }),
  setLast: (lastInput) => {
    if (get().lastInput !== lastInput) set({ lastInput })
  },
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  resetCamera: () => set((s) => ({ cameraReset: s.cameraReset + 1 })),
}))
