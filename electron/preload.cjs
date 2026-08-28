/**
 * Preload script — runs in an isolated context with access to both Node
 * and the DOM. We expose a minimal, typed bridge so the renderer can ask
 * the main process to open external links, get the platform, etc.
 *
 * The renderer never sees `require`, `process`, or `electron` directly.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  version: process.env.npm_package_version || '0.1.0',
  isDev: process.argv.includes('--dev'),

  // Auto-update — renderer side
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (_event, progress) => callback(progress));
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
});
