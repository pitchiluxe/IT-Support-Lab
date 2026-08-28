// Type definitions for the Electron preload bridge. Only loaded when the
// app is running inside the Electron renderer. In a normal browser this
// file is harmless (the global is `undefined`), so we type it accordingly.

export {};

declare global {
  interface Window {
    app?: {
      platform: NodeJS.Platform;
      version: string;
      isDev: boolean;
      onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => void;
      onUpdateDownloaded: (callback: (info: { version: string }) => void) => void;
      onUpdateProgress: (callback: (progress: { percent: number }) => void) => void;
      checkForUpdates: () => Promise<{ version: string } | null>;
      downloadUpdate: () => Promise<boolean>;
      installUpdate: () => void;
    };
  }
}
