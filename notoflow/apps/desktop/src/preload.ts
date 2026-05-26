/**
 * Preload script — pont sécurisé entre le processus renderer (Next.js)
 * et le processus main (Electron).
 *
 * Exposé via contextBridge sous window.electron
 */

import { contextBridge, ipcRenderer } from "electron";

// ─── Types de l'API exposée ────────────────────────────────────────────────────

export interface ElectronAPI {
  // Contrôles de fenêtre
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  };
  // Informations sur l'app
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    isDev: () => Promise<boolean>;
  };
  // Shell
  shell: {
    openExternal: (url: string) => void;
  };
  // Dialogues natifs
  dialog: {
    confirm: (message: string) => Promise<boolean>;
  };
  // Événements depuis le menu natif
  menu: {
    onNewPage: (callback: () => void) => () => void;
  };
}

// ─── Implémentation ────────────────────────────────────────────────────────────

const electronAPI: ElectronAPI = {
  window: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
    onMaximizedChange: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
        callback(isMaximized);
      };
      ipcRenderer.on("window:maximized-change", handler);
      // Retourne une fonction de nettoyage
      return () => ipcRenderer.removeListener("window:maximized-change", handler);
    },
  },

  app: {
    getVersion: () => ipcRenderer.invoke("app:get-version"),
    getPlatform: () => ipcRenderer.invoke("app:get-platform"),
    isDev: () => ipcRenderer.invoke("app:is-dev"),
  },

  shell: {
    openExternal: (url: string) => ipcRenderer.send("shell:open-external", url),
  },

  dialog: {
    confirm: (message: string) => ipcRenderer.invoke("dialog:confirm", message),
  },

  menu: {
    onNewPage: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("menu:new-page", handler);
      return () => ipcRenderer.removeListener("menu:new-page", handler);
    },
  },
};

// Exposer l'API sous window.electron (contextIsolation: true)
contextBridge.exposeInMainWorld("electron", electronAPI);
