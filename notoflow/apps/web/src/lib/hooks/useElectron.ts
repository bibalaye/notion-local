"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Détecte si l'app tourne dans Electron et expose l'API window.electron.
 * Retourne null si on est dans un navigateur classique.
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const electron = window.electron;
    if (!electron) return;

    setIsElectron(true);

    // Récupérer les infos de l'app
    electron.app.getPlatform().then(setPlatform);
    electron.app.getVersion().then(setAppVersion);
    electron.window.isMaximized().then(setIsMaximized);

    // Écouter les changements d'état de la fenêtre
    const cleanup = electron.window.onMaximizedChange(setIsMaximized);
    return cleanup;
  }, []);

  const minimize = useCallback(() => window.electron?.window.minimize(), []);
  const maximize = useCallback(() => window.electron?.window.maximize(), []);
  const close = useCallback(() => window.electron?.window.close(), []);

  const openExternal = useCallback((url: string) => {
    window.electron?.shell.openExternal(url);
  }, []);

  const confirm = useCallback(async (message: string): Promise<boolean> => {
    if (!window.electron) return window.confirm(message);
    return window.electron.dialog.confirm(message);
  }, []);

  return {
    isElectron,
    platform,
    appVersion,
    isMaximized,
    minimize,
    maximize,
    close,
    openExternal,
    confirm,
    /** true si on est sur macOS dans Electron */
    isMac: isElectron && platform === "darwin",
    /** true si on est sur Windows dans Electron */
    isWindows: isElectron && platform === "win32",
    /** true si on est sur Linux dans Electron */
    isLinux: isElectron && platform === "linux",
  };
}
