/**
 * main.ts — Point d'entrée du processus principal Electron.
 *
 * Architecture (skill Electron) :
 *  - main.ts    : cycle de vie app + orchestration
 *  - config.ts  : URL de l'app (Vercel prod / localhost dev)
 *  - windows.ts : BrowserWindow (loading + principale)
 *  - ipc.ts     : handlers ipcMain
 *  - menu.ts    : menu natif
 *  - tray.ts    : icône système
 *  - logger.ts  : logging centralisé vers fichier
 *
 * En production, l'app charge directement https://notion-local-one.vercel.app/
 * Aucun serveur local, aucun Node.js bundlé, aucune gestion de standalone.
 */

import { app, dialog, shell } from "electron";

import { initLogger, log, setLogCallback, closeLogger } from "./logger";
import { getAppUrl, isDev } from "./config";
import {
  createLoadingWindow,
  updateLoadingStatus,
  createMainWindow,
  showOrCreateMainWindow,
} from "./windows";
import { registerIpcHandlers, attachWindowStateListeners } from "./ipc";
import { createAppMenu } from "./menu";
import { createTray, destroyTray } from "./tray";

// ─── Cycle de vie ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  initLogger();
  log(`[App] isDev=${isDev}, platform=${process.platform}`);
  log(`[App] userData=${app.getPath("userData")}`);

  // Brancher le logger sur la loading window
  setLogCallback((msg) => updateLoadingStatus(msg));

  // Afficher la loading screen immédiatement
  createLoadingWindow();

  const appUrl = getAppUrl();
  log(`[App] URL : ${appUrl}`);

  try {
    updateLoadingStatus("Connexion à NotoFlow...");

    // Enregistrer les handlers IPC avant de créer la fenêtre
    registerIpcHandlers();

    // Créer le menu natif
    createAppMenu();

    // Créer la fenêtre principale — charge directement l'URL Vercel
    updateLoadingStatus("Ouverture de l'application...");
    createMainWindow(appUrl);

    // Attacher les listeners maximize/unmaximize après createMainWindow()
    attachWindowStateListeners();

    // Créer l'icône système
    createTray(appUrl);

    // macOS : recréer la fenêtre si l'app est réactivée sans fenêtre ouverte
    app.on("activate", () => {
      showOrCreateMainWindow(appUrl);
    });
  } catch (err) {
    const msg = String(err);
    log(`[App] ERREUR FATALE : ${msg}`);

    const { response } = await dialog.showMessageBox({
      type: "error",
      title: "Erreur de démarrage",
      message: "NotoFlow n'a pas pu démarrer",
      detail: `${msg}\n\nLogs : ${app.getPath("logs")}\\notoflow.log`,
      buttons: ["Voir les logs", "Quitter"],
    });
    if (response === 0) shell.openPath(app.getPath("logs"));

    app.quit();
  }
});

app.on("window-all-closed", () => {
  // Sur macOS, l'app reste active même sans fenêtre (comportement standard)
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  log("[App] Fermeture...");
  destroyTray();
  setLogCallback(null);
  closeLogger();
});
