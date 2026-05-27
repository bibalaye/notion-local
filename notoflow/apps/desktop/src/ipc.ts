/**
 * ipc.ts — Handlers IPC du processus main.
 *
 * Bonnes pratiques Electron :
 *  - ipcMain.handle() pour les requêtes avec réponse (invoke/handle)
 *  - ipcMain.on()     pour les messages unidirectionnels (send/on)
 *  - Validation des arguments avant toute action
 *  - Pas d'exposition directe de Node.js au renderer (via preload uniquement)
 */

import { ipcMain, app, shell, dialog, BrowserWindow } from "electron";
import { log } from "./logger";
import { getMainWindow } from "./windows";

export function registerIpcHandlers(): void {
  // ── Contrôles de fenêtre ──────────────────────────────────────────────────

  ipcMain.on("window:minimize", () => {
    getMainWindow()?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    getMainWindow()?.close();
  });

  ipcMain.handle("window:is-maximized", () => {
    return getMainWindow()?.isMaximized() ?? false;
  });

  // ── Informations sur l'app ────────────────────────────────────────────────

  ipcMain.handle("app:get-version",  () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:is-dev",       () => !app.isPackaged);

  // ── Shell ─────────────────────────────────────────────────────────────────

  ipcMain.on("shell:open-external", (_event, url: unknown) => {
    // Validation : accepter uniquement les URLs http(s)
    if (typeof url === "string" && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    } else {
      log(`[IPC] shell:open-external — URL rejetée : ${url}`);
    }
  });

  // ── Dialogues natifs ──────────────────────────────────────────────────────

  ipcMain.handle("dialog:confirm", async (_event, message: unknown) => {
    const win = getMainWindow();
    if (!win || typeof message !== "string") return false;

    const result = await dialog.showMessageBox(win, {
      type: "question",
      buttons: ["Annuler", "Confirmer"],
      defaultId: 1,
      cancelId: 0,
      message,
    });
    return result.response === 1;
  });

  log("[IPC] Handlers enregistrés");
}

/**
 * Attache les événements maximize/unmaximize à la fenêtre principale
 * pour notifier le renderer via webContents.send.
 *
 * Doit être appelé APRÈS la création de la fenêtre principale.
 */
export function attachWindowStateListeners(): void {
  const win = getMainWindow();
  if (!win) return;

  win.on("maximize",   () => win.webContents.send("window:maximized-change", true));
  win.on("unmaximize", () => win.webContents.send("window:maximized-change", false));

  log("[IPC] Listeners état fenêtre attachés");
}
