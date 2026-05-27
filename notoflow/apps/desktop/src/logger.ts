/**
 * logger.ts — Logging centralisé vers fichier + console.
 * Singleton initialisé une fois au démarrage via initLogger().
 */

import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

let logStream: fs.WriteStream | null = null;

// Callback optionnel pour pousser les logs vers la loading window
let onLogLine: ((msg: string) => void) | null = null;

export function initLogger(): void {
  const logDir = app.getPath("logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, "notoflow.log");
  logStream = fs.createWriteStream(logFile, { flags: "a" });
  const ts = new Date().toISOString();
  log(`\n${"=".repeat(60)}\n[${ts}] NotoFlow démarrage\n${"=".repeat(60)}`);
}

export function setLogCallback(cb: ((msg: string) => void) | null): void {
  onLogLine = cb;
}

export function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream?.write(line + "\n");
  onLogLine?.(msg);
}

export function closeLogger(): void {
  logStream?.end();
  logStream = null;
}
