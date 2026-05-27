/**
 * next-server.ts — Gestion du processus Next.js embarqué.
 *
 * Responsabilités :
 *  - Résoudre les chemins du standalone packagé
 *  - Trouver le binaire Node.js (bundlé ou système)
 *  - Spawner le serveur Next.js avec les variables d'env
 *  - Attendre que le port HTTP réponde
 *  - Exposer start() / stop()
 */

import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { spawn, execFile, type ChildProcess } from "node:child_process";
import { log } from "./logger";
import type { AppConfig } from "./config";
import { buildEnvForNextServer } from "./config";

// ─── Constantes ────────────────────────────────────────────────────────────────

export const PROD_PORT = 3100;
export const DEV_URL   = "http://localhost:3000";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let nextProcess: ChildProcess | null = null;

// ─── Résolution des chemins ────────────────────────────────────────────────────

export function getWebAppDir(): string {
  if (isDev) {
    // En dev : pointe vers apps/web/ dans le monorepo
    return path.join(__dirname, "..", "..", "web");
  }
  // En prod : resources/app/apps/web/ (standalone-flat copié par build-prod.js)
  return path.join(process.resourcesPath, "app", "apps", "web");
}

export function getServerScript(): string {
  return path.join(getWebAppDir(), "server.js");
}

/**
 * Vérifie la présence des fichiers critiques du standalone.
 * Retourne une liste d'erreurs (vide = OK).
 */
export function checkWebAppIntegrity(): string[] {
  const webDir = getWebAppDir();
  const required = [
    "server.js",
    path.join(".next", "BUILD_ID"),
    path.join("node_modules", "next"),
    path.join("node_modules", "styled-jsx"), // hoissé par build-prod.js
  ];
  return required
    .filter((rel) => !fs.existsSync(path.join(webDir, rel)))
    .map((rel) => `Manquant : ${rel}`);
}

// ─── Résolution du binaire Node.js ────────────────────────────────────────────

function getNodeExecutable(): string {
  if (!isDev) {
    const ext = process.platform === "win32" ? "node.exe" : "node";
    const bundled = path.join(process.resourcesPath, ext);
    if (fs.existsSync(bundled)) {
      log(`[Server] Node.js bundlé : ${bundled}`);
      return bundled;
    }
    log(`[Server] Node.js bundlé introuvable : ${bundled}`);
  }

  if (process.platform === "win32") {
    const candidates = [
      process.env.NODE_PATH,
      path.join(process.env["ProgramFiles"] ?? "C:\\Program Files", "nodejs", "node.exe"),
      path.join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "nodejs", "node.exe"),
      path.join(process.env["APPDATA"] ?? "", "nvm", "current", "node.exe"),
      path.join(process.env["NVM_HOME"] ?? "", "node.exe"),
    ].filter(Boolean) as string[];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        log(`[Server] Node.js système : ${c}`);
        return c;
      }
    }
  }

  log("[Server] Node.js : utilisation du PATH");
  return "node";
}

// ─── Attente du port HTTP ─────────────────────────────────────────────────────

function waitForPort(
  port: number,
  maxAttempts = 120,
  onProgress?: (attempt: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      onProgress?.(attempts);

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
            `Le serveur Next.js n'a pas répondu après ${maxAttempts}s.\n` +
              `Logs : ${app.getPath("logs")}\\notoflow.log`,
          ),
        );
        return;
      }
      setTimeout(check, 1000);
    };

    check();
  });
}

// ─── Démarrage du serveur ─────────────────────────────────────────────────────

export function startNextServer(
  config: Partial<AppConfig>,
  onProgress?: (msg: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      log("[Server] Mode dev — serveur Next.js externe attendu sur :3000");
      resolve();
      return;
    }

    const webDir      = getWebAppDir();
    const serverScript = getServerScript();
    const nodeExec    = getNodeExecutable();

    log(`[Server] webDir        : ${webDir}`);
    log(`[Server] serverScript  : ${serverScript}`);
    log(`[Server] nodeExec      : ${nodeExec}`);

    if (!fs.existsSync(webDir)) {
      reject(new Error(`Répertoire web introuvable : ${webDir}`));
      return;
    }
    if (!fs.existsSync(serverScript)) {
      reject(new Error(`server.js introuvable : ${serverScript}`));
      return;
    }

    const integrity = checkWebAppIntegrity();
    if (integrity.length > 0) {
      log(`[Server] AVERTISSEMENT intégrité : ${integrity.join(", ")}`);
    }

    const env = buildEnvForNextServer(config, PROD_PORT);
    onProgress?.("Démarrage du serveur Next.js...");

    // Vérifier la version de Node avant de spawner
    execFile(nodeExec, ["--version"], (err, stdout) => {
      if (err) {
        log(`[Server] ERREUR node --version : ${err.message}`);
      } else {
        log(`[Server] Node.js version : ${stdout.trim()}`);
      }

      nextProcess = spawn(nodeExec, [serverScript], {
        cwd: webDir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
      });

      nextProcess.stdout?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        log(`[Next.js] ${msg}`);
        if (/ready|Ready|started/i.test(msg)) {
          onProgress?.("Serveur prêt !");
        }
      });

      nextProcess.stderr?.on("data", (data: Buffer) => {
        log(`[Next.js ERR] ${data.toString().trim()}`);
      });

      nextProcess.on("error", (err) => {
        log(`[Server] Erreur spawn : ${err.message}`);
        reject(err);
      });

      nextProcess.on("exit", (code, signal) => {
        log(`[Server] Next.js terminé — code=${code} signal=${signal}`);
        if (code !== 0 && code !== null) {
          reject(new Error(`Next.js s'est arrêté avec le code ${code}`));
        }
      });

      waitForPort(PROD_PORT, 120, (attempt) => {
        if (attempt % 10 === 0) {
          onProgress?.(`Attente du serveur... (${attempt}s)`);
        }
      })
        .then(() => {
          log("[Server] Serveur Next.js prêt !");
          resolve();
        })
        .catch(reject);
    });
  });
}

// ─── Arrêt du serveur ─────────────────────────────────────────────────────────

export function stopNextServer(): void {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
    log("[Server] Serveur Next.js arrêté");
  }
}
