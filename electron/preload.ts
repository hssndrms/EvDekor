
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getAllData: (entity: string) => Promise<any[]>;
  getById: (entity: string, id: string) => Promise<any | undefined>;
  addData: (entity: string, data: any) => Promise<any>;
  updateData: (entity: string, data: any) => Promise<any>;
  deleteData: (entity: string, id: string) => Promise<void>;
  getSetting: <T>(key: string) => Promise<T | undefined>;
  setSetting: (key: string, value: any) => Promise<void>;
}

const electronAPI: ElectronAPI = {
  getAllData: (entity) => ipcRenderer.invoke('get-all-data', entity),
  getById: (entity, id) => ipcRenderer.invoke('get-by-id', entity, id),
  addData: (entity, data) => ipcRenderer.invoke('add-data', entity, data),
  updateData: (entity, data) => ipcRenderer.invoke('update-data', entity, data),
  deleteData: (entity, id) => ipcRenderer.invoke('delete-data', entity, id),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
