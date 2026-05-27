/**
 * menu.ts — Menu natif de l'application.
 */

import { Menu, shell, app } from "electron";
import { log } from "./logger";
import { getMainWindow } from "./windows";

export function createAppMenu(): void {
  const isDev = !app.isPackaged;

  const template: Electron.MenuItemConstructorOptions[] = [
    // Menu "NotoFlow" sur macOS uniquement
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
          click: () => getMainWindow()?.webContents.send("menu:new-page"),
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
  log("[Menu] Menu natif créé");
}
