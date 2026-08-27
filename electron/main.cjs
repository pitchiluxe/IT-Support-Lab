/**
 * Electron main process — IT Support Lab Academy
 *
 * Wraps the Vite production build (dist/) as a native Windows desktop app.
 * The preload script exposes a minimal, context-isolated bridge so the
 * renderer stays sandboxed from Node.js APIs while the window chrome and
 * system integration are handled here in the main process.
 *
 * Key behaviours:
 *  - Window: 1280×800 default, min 900×600, centred, with native title bar
 *  - App icon: drawn from build-assets/installer-icon.ico
 *  - Protocol: file:// pointing at dist/index.html
 *  - DevTools: off by default, toggled via --dev flag
 *  - PWA: IndexedDB is available inside the webContents (the app is fully
 *    offline-capable after first load)
 */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, Menu, shell } = require('electron');

// Diagnostic log file. Helps debug "JavaScript error in main process"
// dialogs where the user can't see what's printed. Only written when
// ITSLA_DEBUG=1.
if (process.env.ITSLA_DEBUG) {
  const logPath = path.join(app.getPath('userData'), 'main.log');
  try {
    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ITSLA_DEBUG enabled\n`);
    const log = (...args) => {
      try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${args.join(' ')}\n`); } catch (_) {}
    };
    process.on('uncaughtException', (err) => {
      log('UNCAUGHT', err && err.stack ? err.stack : String(err));
    });
    process.on('unhandledRejection', (err) => {
      log('UNHANDLED REJECTION', err && err.stack ? err.stack : String(err));
    });
    log('main.cjs loaded, argv =', process.argv.join(' '));
  } catch (_) { /* ignore */ }
}

// ── Single instance lock ────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── Window reference ────────────────────────────────────────────────────────
let mainWindow = null;

const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,           // show after ready-to-show to avoid white flash
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      // Context isolation + no Node in renderer is the secure baseline.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // ── Load the app ─────────────────────────────────────────────────────────
  if (isDev) {
    // Dev: load the Vite dev server so HMR works.
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load the pre-built app from dist/.
    // Vite builds with base "/" so assets are at /assets/… which resolves
    // correctly when loaded via file:// pointing at dist/index.html.
    const distPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(distPath);
  }

  // ── Show when ready ──────────────────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Maximise on first launch only — saves user preference on subsequent runs.
    // app.getPath('userData') always returns a non-empty string, so to detect
    // "first run" we look for a sentinel file in the userData directory.
    // (`app.getUserDataPath()` is NOT a valid Electron API — using it here was
    // crashing the packaged app with a TypeError on startup.)
    try {
      const userDataDir = app.getPath('userData');
      const sentinel = path.join(userDataDir, '.initialized');
      if (!fs.existsSync(sentinel)) {
        // First run: maximise the window so the landing page looks great
        // immediately, then mark the sentinel so we don't maximise again.
        mainWindow.maximize();
        try { fs.writeFileSync(sentinel, new Date().toISOString()); } catch (_) {}
      }
    } catch (_) {
      // If anything goes wrong, just skip the maximize — better than crashing.
    }
  });

  // Surface renderer crashes in the main process so we can see them in the
  // terminal during development. In production, the user just sees the
  // standard Electron error dialog.
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (process.env.ITSLA_DEBUG) {
      try {
        fs.appendFileSync(
          path.join(app.getPath('userData'), 'main.log'),
          `[${new Date().toISOString()}] render-process-gone: ${JSON.stringify(details)}\n`,
        );
      } catch (_) {}
    }
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, source) => {
    if (process.env.ITSLA_DEBUG) {
      try {
        fs.appendFileSync(
          path.join(app.getPath('userData'), 'main.log'),
          `[${new Date().toISOString()}] [renderer] ${source}:${line} ${message}\n`,
        );
      } catch (_) {}
    }
  });

  // Always log resource-load failures to main.log so a missing asset or a
  // bad base path shows up in a file the user/developer can read — instead
  // of a silent black screen. This is harmless in production (just a file
  // append guarded by ITSLA_DEBUG) but invaluable when triaging.
  if (process.env.ITSLA_DEBUG) {
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      try {
        fs.appendFileSync(
          path.join(app.getPath('userData'), 'main.log'),
          `[${new Date().toISOString()}] did-fail-load mainFrame=${isMainFrame} code=${errorCode} ${errorDescription} url=${validatedURL}\n`,
        );
      } catch (_) {}
    });
    mainWindow.webContents.on('did-finish-load', () => {
      try {
        fs.appendFileSync(
          path.join(app.getPath('userData'), 'main.log'),
          `[${new Date().toISOString()}] did-finish-load\n`,
        );
      } catch (_) {}
    });
    mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
      try {
        fs.appendFileSync(
          path.join(app.getPath('userData'), 'main.log'),
          `[${new Date().toISOString()}] preload-error path=${preloadPath} ${error && error.stack ? error.stack : String(error)}\n`,
        );
      } catch (_) {}
    });
  }

  // Open external links in the system browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow same-origin navigation (local assets)
    if (url.startsWith('file://') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Application menu ─────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About IT Support Lab Academy',
          click() {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About IT Support Lab Academy',
              message: 'IT Support Lab Academy',
              detail: 'Version 0.1.0\n\nA hands-on training platform for IT support professionals. Built by Erick Omari.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows exist.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
