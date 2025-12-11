import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: any) => ipcRenderer.invoke('set-config', config),
  getTenantInfo: () => ipcRenderer.invoke('get-tenant-info'),
  setTenantInfo: (tenant: any) => ipcRenderer.invoke('set-tenant-info', tenant),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update-downloaded', callback),
});
