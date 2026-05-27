/**
 * main.ts — Point d'entrée du processus principal Electron.
 *
 * Architecture (skill Electron) :
 *  - main.ts       : cycle de vie app + orchestration
 *  - windows.ts    : création et gestion des BrowserWindow
 *  - ipc.ts        : handlers ipcMain
 *  - menu.ts       : menu natif
 *  - tray.ts       : icône système
 *  - next-server.ts: serveur Next.js embarqué
 *  - config.ts     : chargement sécurisé de la configuration
 *  - logger.ts     : logging centralisé vers fichier
 */

import { app, dialog, shell } from "electron";
import path from "node:path";

import { initLogger, log, setLogCallback, closeLogger } from "./logger";
import { initConfig, isConfigComplete, type AppConfig } from "./config";
import { startNextServer, stopNextServer, PROD_PORT, DEV_URL } from "./next-server";
import {
  createLoadingWindow,
  updateLoadingStatus,
  closeLoadingWindow,
  createMainWindow,
  showOrCreateMainWindow,
} from "./windows";
import { registerIpcHandlers, attachWindowStateListeners } from "./ipc";
import { createAppMenu } from "./menu";
import { createTray, destroyTray } from "./tray";

// ─── Constantes ────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ─── Chargement de la configuration ───────────────────────────────────────────

async function loadOrSetupConfig(): Promise<Partial<AppConfig> | null> {
  const monorepoRoot = isDev
    ? path.join(__dirname, "..", "..", "..", "..")
    : undefined;

  const config = initConfig(isDev, monorepoRoot);
  log(`[Config] Clés chargées : ${Object.keys(config).join(", ") || "aucune"}`);

  if (!isDev && !isConfigComplete(config)) {
    const configDir = path.join(app.getPath("userData"), "config");
    const { response } = await dialog.showMessageBox({
      type: "error",
      title: "Configuration manquante",
      message: "NotoFlow n'a pas pu charger sa configuration",
      detail:
        "Les clés de connexion sont introuvables.\n\n" +
        "Pour reconfigurer sans réinstaller :\n" +
        `Déposez un fichier .env.local dans :\n${configDir}\n\n` +
        "Puis relancez l'application.",
      buttons: ["Ouvrir le dossier", "Quitter"],
    });
    if (response === 0) shell.openPath(configDir);
    return null;
  }

  return config;
}

// ─── Cycle de vie ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  initLogger();
  log(`[App] isDev=${isDev}, platform=${process.platform}`);
  log(`[App] resourcesPath=${process.resourcesPath}`);
  log(`[App] userData=${app.getPath("userData")}`);

  // Brancher le logger sur la loading window (avant sa création)
  setLogCallback((msg) => updateLoadingStatus(msg));

  // Afficher la loading screen immédiatement
  createLoadingWindow();

  const appUrl = isDev ? DEV_URL : `http://localhost:${PROD_PORT}`;

  try {
    // 1. Charger la configuration
    updateLoadingStatus("Chargement de la configuration...");
    const config = await loadOrSetupConfig();
    if (!config) {
      app.quit();
      return;
    }

    // 2. Démarrer le serveur Next.js embarqué
    updateLoadingStatus("Démarrage du serveur...");
    await startNextServer(config, (msg) => updateLoadingStatus(msg));

    // 3. Enregistrer les handlers IPC avant de créer la fenêtre
    registerIpcHandlers();

    // 4. Créer le menu natif
    createAppMenu();

    // 5. Créer la fenêtre principale
    updateLoadingStatus("Ouverture de l'application...");
    createMainWindow(appUrl);

    // 6. Attacher les listeners d'état fenêtre (maximize/unmaximize)
    //    Doit être après createMainWindow()
    attachWindowStateListeners();

    // 7. Créer l'icône système
    createTray(appUrl);

    // macOS : recréer la fenêtre si l'app est réactivée sans fenêtre ouverte
    app.on("activate", () => {
      showOrCreateMainWindow(appUrl);
    });
  } catch (err) {
    const msg = String(err);
    log(`[App] ERREUR FATALE : ${msg}`);
    closeLoadingWindow();

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
  stopNextServer();
  destroyTray();
  setLogCallback(null);
  closeLogger();
});
