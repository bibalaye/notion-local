/**
 * windows.ts — Gestion des fenêtres Electron (loading + principale).
 *
 * Suit les bonnes pratiques du skill Electron :
 *  - contextIsolation: true, nodeIntegration: false, sandbox: true
 *  - preload script pour le pont IPC
 *  - show: false + ready-to-show pour éviter le flash blanc
 *  - setWindowOpenHandler pour les liens externes
 */

import { BrowserWindow, shell, app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { log } from "./logger";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ─── Icône ────────────────────────────────────────────────────────────────────

export function getIconPath(): string {
  const assetsDir = isDev
    ? path.join(__dirname, "..", "assets")
    : path.join(process.resourcesPath, "assets");

  const byPlatform: Record<string, string[]> = {
    win32:  ["icon.ico", "icon.png"],
    darwin: ["icon.icns", "icon.png"],
    linux:  ["icon.png"],
  };

  const candidates = (byPlatform[process.platform] ?? ["icon.png"]).map((f) =>
    path.join(assetsDir, f),
  );

  return candidates.find((c) => fs.existsSync(c)) ?? "";
}

// ─── Fenêtre de chargement ────────────────────────────────────────────────────

let loadingWindow: BrowserWindow | null = null;

export function createLoadingWindow(): BrowserWindow {
  loadingWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: "#0a0a0a",
    show: true,
    // Pas de preload nécessaire — la loading window n'a pas besoin d'IPC
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  loadingWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(getLoadingHtml())}`,
  );

  loadingWindow.on("closed", () => {
    loadingWindow = null;
  });

  return loadingWindow;
}

/**
 * Met à jour le statut affiché dans la loading window.
 * Utilise executeJavaScript avec un argument JSON pour éviter l'injection.
 */
export function updateLoadingStatus(msg: string): void {
  if (!loadingWindow || loadingWindow.isDestroyed()) return;
  // Passer le message via JSON.stringify pour éviter tout problème d'échappement
  const safeMsg = JSON.stringify(msg);
  loadingWindow.webContents
    .executeJavaScript(
      `(function(m){
        var s = document.getElementById('status');
        var l = document.getElementById('log');
        if (s) s.textContent = m;
        if (l) l.textContent = m;
      })(${safeMsg})`,
    )
    .catch(() => {});
}

export function closeLoadingWindow(): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close();
    loadingWindow = null;
  }
}

function getLoadingHtml(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a; color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 100vh; gap: 20px; user-select: none;
    }
    .logo { font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -1px; }
    .logo span { color: #6366f1; }
    .spinner {
      width: 24px; height: 24px;
      border: 2px solid #222; border-top-color: #6366f1;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { font-size: 12px; color: #555; text-align: center; max-width: 340px; }
    .log    { font-size: 10px; color: #333; font-family: monospace; max-width: 380px; text-align: center; }
  </style>
</head>
<body>
  <div class="logo">Noto<span>Flow</span></div>
  <div class="spinner"></div>
  <p class="status" id="status">Démarrage...</p>
  <p class="log"    id="log"></p>
</body>
</html>`;
}

// ─── Fenêtre principale ────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createMainWindow(appUrl: string): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "NotoFlow",
    icon: getIconPath(),
    // Barre de titre native cachée — les contrôles sont dans le renderer
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#0a0a0a",
    // show: false → on attend ready-to-show pour éviter le flash blanc
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,   // Sécurité : isolation du contexte renderer
      nodeIntegration: false,   // Sécurité : pas d'accès Node dans le renderer
      sandbox: true,            // Sécurité : sandbox Chromium activé
      webSecurity: !isDev,      // Désactivé en dev pour les requêtes cross-origin
    },
  });

  log(`[Window] Chargement URL : ${appUrl}`);
  mainWindow.loadURL(appUrl);

  // Afficher la fenêtre seulement quand le contenu est prêt (évite le flash blanc)
  mainWindow.once("ready-to-show", () => {
    closeLoadingWindow();
    mainWindow?.show();
    mainWindow?.focus();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
    log("[Window] Fenêtre principale affichée");
  });

  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    log(`[Window] Échec chargement ${url} : ${code} ${desc}`);
  });

  // Ouvrir les liens externes dans le navigateur système, pas dans Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith("http://localhost")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    log("[Window] Fenêtre principale fermée");
  });

  return mainWindow;
}

export function showOrCreateMainWindow(appUrl: string): void {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow(appUrl);
  }
}
