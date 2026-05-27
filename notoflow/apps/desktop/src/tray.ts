/**
 * tray.ts — Icône système (system tray) NotoFlow.
 */

import { Tray, Menu, shell, app, nativeImage } from "electron";
import path from "node:path";
import { log } from "./logger";
import { getIconPath, showOrCreateMainWindow } from "./windows";

let tray: Tray | null = null;

export function createTray(appUrl: string): void {
  const iconPath = getIconPath();
  if (!iconPath) {
    log("[Tray] Icône introuvable — tray non créé");
    return;
  }

  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("NotoFlow");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Ouvrir NotoFlow",
      click: () => showOrCreateMainWindow(appUrl),
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
        shell.openPath(configDir);
      },
    },
    { type: "separator" },
    { label: "Quitter", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => showOrCreateMainWindow(appUrl));

  log("[Tray] Icône système créée");
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
