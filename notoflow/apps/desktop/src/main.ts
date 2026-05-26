import { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage, dialog } from "electron";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import fs from "node:fs";

// ─── Constantes ────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 3100;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let nextServer: ChildProcess | null = null;

// ─── Serveur Next.js (production uniquement) ───────────────────────────────────

function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve();
      return;
    }

    // Chemin vers le serveur standalone Next.js empaqueté
    const serverPath = path.join(process.resourcesPath, "app", "server.js");

    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Serveur Next.js introuvable : ${serverPath}`));
      return;
    }

    nextServer = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PROD_PORT),
        NODE_ENV: "production",
        // Pointe vers les fichiers statiques empaquetés
        NEXT_PUBLIC_APP_URL: `http://localhost:${PROD_PORT}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    nextServer.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      console.log("[Next.js]", msg);
      // Le serveur est prêt quand il affiche "Ready"
      if (msg.includes("Ready") || msg.includes("started server")) {
        resolve();
      }
    });

    nextServer.stderr?.on("data", (data: Buffer) => {
      console.error("[Next.js Error]", data.toString());
    });

    nextServer.on("error", reject);

    // Timeout de sécurité : 30 secondes
    setTimeout(() => resolve(), 30_000);
  });
}

// ─── Création de la fenêtre principale ────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "NotoFlow",
    // Icône selon la plateforme
    icon: getIconPath(),
    // Barre de titre native masquée — on utilise notre propre titlebar
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#0a0a0a",
    show: false, // Affiché après le chargement pour éviter le flash blanc
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Autorise les requêtes vers localhost en dev
      webSecurity: !isDev,
    },
  });

  // Charger l'URL selon l'environnement
  const appUrl = isDev ? DEV_URL : `http://localhost:${PROD_PORT}`;
  mainWindow.loadURL(appUrl);

  // Afficher la fenêtre une fois prête (évite le flash blanc)
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  // Ouvrir les liens externes dans le navigateur système
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

// ─── Icône selon la plateforme ─────────────────────────────────────────────────

function getIconPath(): string {
  const assetsDir = isDev
    ? path.join(__dirname, "..", "assets")
    : path.join(process.resourcesPath, "assets");

  if (process.platform === "win32") return path.join(assetsDir, "icon.ico");
  if (process.platform === "darwin") return path.join(assetsDir, "icon.icns");
  return path.join(assetsDir, "icon.png");
}

// ─── Menu de la barre des tâches (Tray) ───────────────────────────────────────

function createTray(): void {
  const iconPath = getIconPath();
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
      label: "Quitter",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ─── Menu applicatif natif ─────────────────────────────────────────────────────

function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS : menu "NotoFlow"
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
          click: () => {
            mainWindow?.webContents.send("menu:new-page");
          },
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
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Handlers IPC ─────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Contrôles de fenêtre (titlebar custom)
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window:close", () => mainWindow?.close());

  // Infos sur la fenêtre
  ipcMain.handle("window:is-maximized", () => mainWindow?.isMaximized() ?? false);

  // Infos sur l'app
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:is-dev", () => isDev);

  // Ouvrir un lien externe
  ipcMain.on("shell:open-external", (_event, url: string) => {
    if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
      shell.openExternal(url);
    }
  });

  // Dialogue de confirmation avant de quitter
  ipcMain.handle("dialog:confirm", async (_event, message: string) => {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: "question",
      buttons: ["Annuler", "Confirmer"],
      defaultId: 1,
      message,
    });
    return result.response === 1;
  });

  // Écouter les changements d'état de la fenêtre pour mettre à jour le titlebar
  mainWindow?.on("maximize", () => {
    mainWindow?.webContents.send("window:maximized-change", true);
  });
  mainWindow?.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximized-change", false);
  });
}

// ─── Cycle de vie de l'app ─────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    // Démarrer le serveur Next.js en production
    await startNextServer();

    createAppMenu();
    createMainWindow();
    createTray();
    registerIpcHandlers();

    // macOS : recréer la fenêtre si on clique sur l'icône du dock
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (err) {
    console.error("Erreur au démarrage :", err);
    dialog.showErrorBox("Erreur de démarrage", String(err));
    app.quit();
  }
});

// Quitter quand toutes les fenêtres sont fermées (sauf macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Arrêter le serveur Next.js à la fermeture
app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
  tray?.destroy();
});
