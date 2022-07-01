import { contextBridge, ipcRenderer } from 'electron';
import { DataValue } from './storage';

/** On content load. */
window.addEventListener('DOMContentLoaded', () => {

  /** Log the versions. */
  for (const type of ['chrome', 'node', 'electron']) {
    console.debug(`[PRELOAD] ${type} v${process.versions[type]}`);
  }
});

/** Expose IPC API. */
contextBridge.exposeInMainWorld('ipc', {
  window: {
    hide: (after: number): void => ipcRenderer.send('window:hide', after),
  },
  shortcut: {
    list: (): Promise<DataValue[]> => ipcRenderer.invoke('shortcut:list'),
    retrieve: (id: string): Promise<DataValue | undefined> => ipcRenderer.invoke('shortcut:retrieve', id),
    destroy: (id: string): Promise<boolean> => ipcRenderer.invoke('shortcut:destroy', id),
    launch: (data: DataValue): void => ipcRenderer.send('shortcut:launch', data),
    create: (data: DataValue): Promise<DataValue> => ipcRenderer.invoke('shortcut:create', data),
    update: (id: string, data: DataValue): Promise<DataValue | undefined> => (
      ipcRenderer.invoke('shortcut:update', id, data)
    ),
  },
});
