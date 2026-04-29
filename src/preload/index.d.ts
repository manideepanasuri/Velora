import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFileDialog: () => Promise<string | null>,
      readFile: (path: string) => Promise<Uint8Array | null>,
      onOpenPdf: (callback: (path: string) => void) => () => void
    }
  }
}
