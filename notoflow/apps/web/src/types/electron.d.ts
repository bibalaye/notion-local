/**
 * Déclaration globale de window.electron
 * Injecté par le preload script Electron via contextBridge.
 * Absent dans le navigateur (window.electron === undefined).
 */

interface ElectronWindowAPI {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  };
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    isDev: () => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => void;
  };
  dialog: {
    confirm: (message: string) => Promise<boolean>;
  };
  menu: {
    onNewPage: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronWindowAPI;
  }
}

export {};
