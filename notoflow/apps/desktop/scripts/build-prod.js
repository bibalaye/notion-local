#!/usr/bin/env node
/**
 * build-prod.js — Build production NotoFlow Desktop (mode Vercel)
 *
 * L'app charge https://notion-local-one.vercel.app/ directement.
 * Aucun serveur local, aucun standalone Next.js, aucun Node.js bundlé.
 *
 * Etapes :
 *  1. Compiler TypeScript Electron → dist/
 *  2. electron-builder → installeur natif (NSIS / DMG / AppImage)
 */

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT        = path.resolve(__dirname, "..", "..", "..");
const DESKTOP_DIR = path.resolve(__dirname, "..");

function run(cmd, cwd = ROOT) {
  console.log(`\n>  ${cmd}`);
  const result = spawnSync(cmd, { shell: true, cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\nEchec (code ${result.status}) : ${cmd}`);
    process.exit(result.status ?? 1);
  }
}

function step(n, total, label) {
  const bar = "-".repeat(58);
  console.log(`\n+${bar}+`);
  console.log(`|  ${n}/${total}  ${label.padEnd(53)}|`);
  console.log(`+${bar}+`);
}

(function main() {
  const TOTAL = 2;
  console.log("\nNotoFlow Desktop - Build Production (Vercel)\n");

  step(1, TOTAL, "Compilation TypeScript Electron");
  run("pnpm --filter @notoflow/desktop build:electron", ROOT);

  step(2, TOTAL, "electron-builder -> installeur");
  run("pnpm --filter @notoflow/desktop dist:win", ROOT);

  console.log("\nBuild termine !");
  console.log(`   Installeur : ${path.join(DESKTOP_DIR, "release", "NotoFlow Setup 0.1.0.exe")}\n`);
})();
