/**
 * Preload script — runs in an isolated context with access to both Node
 * and the DOM. We expose a minimal, typed bridge so the renderer can ask
 * the main process to open external links, get the platform, etc.
 *
 * The renderer never sees `require`, `process`, or `electron` directly.
 */
'use strict';

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  version: process.env.npm_package_version || '0.1.0',
  isDev: process.argv.includes('--dev'),
});
