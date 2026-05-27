import { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage, dialog } from "electron";
import path from "node:path";
import { spawn, ChildProcess, execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import {
  initConfig,
  isConfigComplete,
  buildEnvForNextServer,
  type AppConfig,
} from "./config";

// ─── Constantes ────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 3100;

let mainWindow: BrowserWindow | null = null;
let loadingWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let nextServer: ChildProcess | null = null;

// ─── Logging vers fichier ──────────────────────────────────────────────────────

let logStream: fs.WriteStream | null = null;

function initLogger(): void {
  const logDir = app.getPath("logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, "notoflow.log");
  logStream = fs.createWriteStream(logFile, { flags: "a" });
  const ts = new Date().toISOString();
  log(`\n${"=".repeat(60)}\n[${ts}] NotoFlow démarrage\n${"=".repeat(60)}`);
}

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream?.write(line + "\n");
  // Mettre à jour la loading window si elle existe
  loadingWindow?.webContents.send("log", msg);
}

// ─── Résolution des chemins ────────────────────────────────────────────────────

function getWebAppDir(): string {
  if (isDev) {
    return path.join(__dirname, "..", "..", "web");
  }
  // En prod : resources/app/ = standalone-flat/ (copié par fs.cpSync dereference)
  // Le monorepo Next.js génère le standalone avec la structure apps/web/ préservée.
  // server.js se trouve donc dans resources/app/apps/web/
  return path.join(process.resourcesPath, "app", "apps", "web");
}

function getServerScript(): string {
  return path.join(getWebAppDir(), "server.js");
}

/**
 * Vérifie que les fichiers critiques sont présents dans le standalone packagé.
 * webDir = resources/app/apps/web/  (server.js + .next/ + node_modules hoistés)
 * Retourne une liste d'erreurs (vide = OK).
 */
function checkWebAppIntegrity(webDir: string): string[] {
  const errors: string[] = [];
  const required = [
    "server.js",
    path.join(".next", "BUILD_ID"),
    path.join("node_modules", "next"),
    path.join("node_modules", "styled-jsx"),  // hoissé par build-prod.js
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(webDir, rel))) {
      errors.push(`Manquant : ${rel}`);
    }
  }
  return errors;
}

/**
 * Trouve le binaire node.exe à utiliser pour lancer Next.js.
 * Priorité : node.exe bundlé dans resources > node dans PATH
 */
function getNodeExecutable(): string {
  // 1. Node.js bundlé dans les resources (priorité absolue en production)
  if (!isDev) {
    const ext = process.platform === "win32" ? "node.exe" : "node";
    const bundledNode = path.join(process.resourcesPath, ext);
    if (fs.existsSync(bundledNode)) {
      log(`[Desktop] Node.js bundlé : ${bundledNode}`);
      return bundledNode;
    }
    log(`[Desktop] Node.js bundlé introuvable à : ${bundledNode}`);
  }

  // 2. En dev ou fallback : node dans le PATH système
  if (process.platform === "win32") {
    const candidates = [
      process.env.NODE_PATH,
      path.join(process.env["ProgramFiles"] || "C:\\Program Files", "nodejs", "node.exe"),
      path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "nodejs", "node.exe"),
      path.join(process.env["APPDATA"] || "", "nvm", "current", "node.exe"),
      path.join(process.env["NVM_HOME"] || "", "node.exe"),
    ].filter(Boolean) as string[];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        log(`[Desktop] Node.js système : ${c}`);
        return c;
      }
    }
  }

  log("[Desktop] Node.js : utilisation du PATH");
  return "node";
}

// ─── Fenêtre de chargement ────────────────────────────────────────────────────

function createLoadingWindow(): void {
  loadingWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: "#0a0a0a",
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  loadingWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(getLoadingHtml())}`,
  );
}

function getLoadingHtml(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a; color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 100vh; gap: 20px; user-select: none;
    }
    .logo { font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -1px; }
    .logo span { color: #6366f1; }
    .status { font-size: 12px; color: #555; text-align: center; max-width: 340px; }
    .spinner {
      width: 24px; height: 24px;
      border: 2px solid #222; border-top-color: #6366f1;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .log { font-size: 10px; color: #333; font-family: monospace;
           max-width: 380px; text-align: center; }
  </style>
</head>
<body>
  <div class="logo">Noto<span>Flow</span></div>
  <div class="spinner"></div>
  <div class="status" id="status">Démarrage du serveur...</div>
  <div class="log" id="log"></div>
  <script>
    // Écouter les messages IPC via postMessage (pas de preload ici)
    // Le main process met à jour via executeJavaScript
  </script>
</body>
</html>`;
}

function updateLoadingStatus(msg: string): void {
  if (!loadingWindow || loadingWindow.isDestroyed()) return;
  const escaped = msg.replace(/'/g, "\\'").replace(/\n/g, " ");
  loadingWindow.webContents
    .executeJavaScript(
      `document.getElementById('status').textContent = '${escaped}';
       document.getElementById('log').textContent = '${escaped}';`,
    )
    .catch(() => {});
}

// ─── Attendre que le serveur HTTP soit prêt ───────────────────────────────────

function waitForServer(port: number, maxAttempts = 120): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (attempts % 10 === 0) {
        updateLoadingStatus(`Attente du serveur... (${attempts}s)`);
      }
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(
          new Error(
            `Le serveur Next.js n'a pas répondu après ${maxAttempts} secondes.\n` +
              `Consultez les logs : ${app.getPath("logs")}\\notoflow.log`,
          ),
        );
        return;
      }
      setTimeout(check, 1000);
    };
    check();
  });
}

// ─── Chargement de la configuration ───────────────────────────────────────────

async function loadOrSetupConfig(): Promise<Partial<AppConfig> | null> {
  // Chemin racine du monorepo (en dev uniquement)
  const monorepoRoot = isDev
    ? path.join(__dirname, "..", "..", "..", "..")
    : undefined;

  const config = initConfig(isDev, monorepoRoot);
  log(`[Config] Clés chargées : ${Object.keys(config).join(", ") || "aucune"}`);

  if (!isDev && !isConfigComplete(config)) {
    const configDir = path.join(app.getPath("userData"), "config");
    await dialog.showMessageBox({
      type: "error",
      title: "Configuration manquante",
      message: "NotoFlow n'a pas pu charger sa configuration",
      detail:
        "Les clés de connexion sont introuvables.\n\n" +
        "Pour reconfigurer sans réinstaller :\n" +
        `Déposez un fichier .env.local dans :\n${configDir}\n\n` +
        "Puis relancez l'application.",
      buttons: ["Ouvrir le dossier", "Quitter"],
    }).then((r) => {
      if (r.response === 0) shell.openPath(configDir);
    });
    return null;
  }

  return config;
}

// ─── Serveur Next.js ───────────────────────────────────────────────────────────

function startNextServer(config: Partial<AppConfig>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      log("[Desktop] Mode dev — serveur Next.js externe attendu sur :3000");
      resolve();
      return;
    }

    const webDir = getWebAppDir();
    const serverScript = getServerScript();
    const nodeExec = getNodeExecutable();

    log(`[Desktop] webDir       : ${webDir}`);
    log(`[Desktop] serverScript : ${serverScript}`);
    log(`[Desktop] nodeExec     : ${nodeExec}`);

    if (!fs.existsSync(webDir)) {
      reject(new Error(`Répertoire web introuvable : ${webDir}`));
      return;
    }
    if (!fs.existsSync(serverScript)) {
      reject(new Error(`server.js introuvable : ${serverScript}`));
      return;
    }

    // Vérifier l'intégrité des fichiers critiques
    const integrity = checkWebAppIntegrity(webDir);
    if (integrity.length > 0) {
      log(`[Desktop] AVERTISSEMENT intégrité : ${integrity.join(", ")}`);
    }

    const env = buildEnvForNextServer(config, PROD_PORT);
    updateLoadingStatus("Démarrage du serveur Next.js...");

    // Vérifier que node est accessible
    execFile(nodeExec, ["--version"], (err, stdout) => {
      if (err) {
        log(`[Desktop] ERREUR node --version : ${err.message}`);
        // Continuer quand même, node est peut-être dans le PATH
      } else {
        log(`[Desktop] Node.js version : ${stdout.trim()}`);
      }

      nextServer = spawn(nodeExec, [serverScript], {
        cwd: webDir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
        // Ne pas hériter du shell Electron
        detached: false,
      });

      nextServer.stdout?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        log(`[Next.js] ${msg}`);
        if (msg.includes("ready") || msg.includes("Ready") || msg.includes("started")) {
          updateLoadingStatus("Serveur prêt !");
        }
      });

      nextServer.stderr?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        log(`[Next.js ERR] ${msg}`);
      });

      nextServer.on("error", (err) => {
        log(`[Desktop] Erreur spawn : ${err.message}`);
        reject(err);
      });

      nextServer.on("exit", (code, signal) => {
        log(`[Desktop] Next.js process terminé — code=${code} signal=${signal}`);
        if (code !== 0 && code !== null) {
          reject(new Error(`Next.js s'est arrêté avec le code ${code}`));
        }
      });

      // Attendre que le port réponde
      waitForServer(PROD_PORT)
        .then(() => {
          log("[Desktop] Serveur Next.js prêt !");
          resolve();
        })
        .catch(reject);
    });
  });
}

// ─── Fenêtre principale ────────────────────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "NotoFlow",
    icon: getIconPath(),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !isDev,
    },
  });

  const appUrl = isDev ? DEV_URL : `http://localhost:${PROD_PORT}`;
  log(`[Desktop] Chargement URL : ${appUrl}`);
  mainWindow.loadURL(appUrl);

  mainWindow.once("ready-to-show", () => {
    // Fermer la loading window et afficher la fenêtre principale
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
    mainWindow?.show();
    mainWindow?.focus();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, url) => {
    log(`[Desktop] Échec chargement URL ${url} : ${errorCode} ${errorDescription}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith("http://localhost")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Icône ────────────────────────────────────────────────────────────────────

function getIconPath(): string {
  const assetsDir = isDev
    ? path.join(__dirname, "..", "assets")
    : path.join(process.resourcesPath, "assets");

  const candidates = [
    process.platform === "win32" ? path.join(assetsDir, "icon_512x512.png") : null,
    process.platform === "darwin" ? path.join(assetsDir, "icon_512x512.png") : null,
    path.join(assetsDir, "icon_512x512.png"),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return "";
}

// ─── Tray ──────────────────────────────────────────────────────────────────────

function createTray(): void {
  const iconPath = getIconPath();
  if (!iconPath) return;

  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("NotoFlow");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Ouvrir NotoFlow",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "Voir les logs",
      click: () => shell.openPath(app.getPath("logs")),
    },
    {
      label: "Configuration...",
      click: () => {
        const configDir = path.join(app.getPath("userData"), "config");
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
        shell.openPath(configDir);
      },
    },
    { type: "separator" },
    { label: "Quitter", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ─── Menu natif ───────────────────────────────────────────────────────────────

function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "Fichier",
      submenu: [
        {
          label: "Nouvelle page",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow?.webContents.send("menu:new-page"),
        },
        { type: "separator" },
        {
          label: "Voir les logs",
          click: () => shell.openPath(app.getPath("logs")),
        },
        { type: "separator" },
        process.platform === "darwin"
          ? { role: "close" as const }
          : { role: "quit" as const },
      ],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        { role: "selectAll" as const },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        ...(isDev ? [{ role: "toggleDevTools" as const }] : []),
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Fenêtre",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(process.platform === "darwin"
          ? [{ type: "separator" as const }, { role: "front" as const }]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC ──────────────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window:close", () => mainWindow?.close());
  ipcMain.handle("window:is-maximized", () => mainWindow?.isMaximized() ?? false);
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:is-dev", () => isDev);
  ipcMain.on("shell:open-external", (_event, url: string) => {
    if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
      shell.openExternal(url);
    }
  });
  ipcMain.handle("dialog:confirm", async (_event, message: string) => {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: "question",
      buttons: ["Annuler", "Confirmer"],
      defaultId: 1,
      message,
    });
    return result.response === 1;
  });

  mainWindow?.on("maximize", () => {
    mainWindow?.webContents.send("window:maximized-change", true);
  });
  mainWindow?.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximized-change", false);
  });
}

// ─── Cycle de vie ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  initLogger();
  log(`[Desktop] isDev=${isDev}, platform=${process.platform}`);
  log(`[Desktop] resourcesPath=${process.resourcesPath}`);
  log(`[Desktop] userData=${app.getPath("userData")}`);

  // Afficher la loading screen immédiatement
  createLoadingWindow();

  try {
    // 1. Charger la config
    updateLoadingStatus("Chargement de la configuration...");
    const config = await loadOrSetupConfig();
    if (!config) return; // app.quit() déjà appelé

    // 2. Démarrer Next.js
    updateLoadingStatus("Démarrage du serveur...");
    await startNextServer(config);

    // 3. Créer l'interface
    updateLoadingStatus("Ouverture de l'application...");
    createAppMenu();
    createMainWindow();
    createTray();
    registerIpcHandlers();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (err) {
    const msg = String(err);
    log(`[Desktop] ERREUR FATALE : ${msg}`);

    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
    }

    await dialog.showMessageBox({
      type: "error",
      title: "Erreur de démarrage",
      message: "NotoFlow n'a pas pu démarrer",
      detail: `${msg}\n\nLogs : ${app.getPath("logs")}\\notoflow.log`,
      buttons: ["Voir les logs", "Quitter"],
    }).then((r) => {
      if (r.response === 0) shell.openPath(app.getPath("logs"));
    });

    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  log("[Desktop] Fermeture...");
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
  tray?.destroy();
  logStream?.end();
});
