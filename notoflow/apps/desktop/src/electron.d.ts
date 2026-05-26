/**
 * Déclaration de types globaux pour window.electron
 * Importé dans apps/web pour avoir l'autocomplétion TypeScript.
 */

import type { ElectronAPI } from "./preload";

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
