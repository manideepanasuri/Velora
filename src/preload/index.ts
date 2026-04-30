import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  onOpenPdf: (callback: (path: string) => void) => {
    const subscription = (_event: any, path: string) => callback(path)
    ipcRenderer.on('open-pdf', subscription)
    return () => ipcRenderer.removeListener('open-pdf', subscription)
  },
  onZoomIn: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on('trigger-zoom-in', subscription)
    return () => ipcRenderer.removeListener('trigger-zoom-in', subscription)
  },
  onZoomOut: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on('trigger-zoom-out', subscription)
    return () => ipcRenderer.removeListener('trigger-zoom-out', subscription)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
