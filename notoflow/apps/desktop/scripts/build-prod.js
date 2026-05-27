#!/usr/bin/env node
/**
 * build-prod.js — Orchestrateur de build production NotoFlow Desktop
 *
 * Etapes :
 *  1. Build Next.js  → apps/web/.next/standalone/  (symlinks pnpm)
 *  2. Aplatir        → apps/desktop/standalone-flat/  (fs.cpSync dereference)
 *  3. Chiffrer .env.local → assets/env.enc  (AES-256-GCM)
 *  4. Compiler TypeScript Electron
 *  5. Telecharger Node.js v20 LTS (bundled dans resources/)
 *  6. electron-builder → .exe NSIS
 *
 * Pas de robocopy, pas de PowerShell, pas de scripts de copie externes.
 * fs.cpSync avec dereference:true resout nativement tous les symlinks pnpm.
 */

const { spawnSync } = require("child_process");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const ROOT        = path.resolve(__dirname, "..", "..", "..");
const DESKTOP_DIR = path.resolve(__dirname, "..");
const WEB_DIR     = path.resolve(ROOT, "apps", "web");
const STANDALONE  = path.join(WEB_DIR, ".next", "standalone");
const FLAT_DIR    = path.join(DESKTOP_DIR, "standalone-flat");
const ASSETS_DIR  = path.join(DESKTOP_DIR, "assets");

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Etape 2 : Aplatissement du standalone (sans robocopy) ───────────────────
//
// fs.cpSync avec dereference:true copie la cible reelle de chaque symlink.
// Fonctionne sur Windows, macOS et Linux sans outil externe.
// Disponible depuis Node.js 16.7 (LTS depuis Node 18).

// ─── Recherche d'un package dans l'arbre .pnpm ───────────────────────────────
//
// pnpm stocke les packages sous :
//   node_modules/.pnpm/<name>@<version>/node_modules/<name>/
//
// Cette fonction trouve le premier dossier correspondant au nom donné.

function findInPnpm(pnpmDir, pkgName) {
  if (!fs.existsSync(pnpmDir)) return null;
  // Chercher dans .pnpm/<pkg>@*/node_modules/<pkg>/
  const entries = fs.readdirSync(pnpmDir);
  const prefix  = pkgName.replace("/", "+") + "@"; // ex: styled-jsx@ ou @scope+pkg@
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue;
    const candidate = path.join(pnpmDir, entry, "node_modules", pkgName);
    if (fs.existsSync(candidate)) return candidate;
  }
  // Chercher aussi dans .pnpm/node_modules/ (hoisted)
  const hoisted = path.join(pnpmDir, "node_modules", pkgName);
  if (fs.existsSync(hoisted)) return hoisted;
  return null;
}

// ─── Packages que Next.js resout depuis apps/web/node_modules/ ───────────────
//
// next/dist/server/require-hook.js appelle resolve('styled-jsx/package.json')
// depuis son propre contexte, donc depuis apps/web/node_modules/.
// Avec pnpm monorepo standalone, ces packages sont dans .pnpm/ a la racine
// et ne sont PAS hoistes dans apps/web/node_modules/.
// On les copie explicitement pour garantir la resolution.

const HOIST_TO_WEB_NODE_MODULES = [
  "styled-jsx",
];

function hoistMissingPackages(flatDir) {
  const webNodeModules  = path.join(flatDir, "apps", "web", "node_modules");
  const rootPnpm        = path.join(flatDir, "node_modules", ".pnpm");

  for (const pkg of HOIST_TO_WEB_NODE_MODULES) {
    const dest = path.join(webNodeModules, pkg);
    if (fs.existsSync(dest)) {
      console.log(`  OK ${pkg} deja present dans apps/web/node_modules/`);
      continue;
    }
    const src = findInPnpm(rootPnpm, pkg);
    if (!src) {
      console.warn(`  AVERTISSEMENT : ${pkg} introuvable dans .pnpm — build peut-etre incomplet`);
      continue;
    }
    console.log(`  Hoist ${pkg} : ${path.relative(flatDir, src)} -> apps/web/node_modules/${pkg}`);
    fs.cpSync(src, dest, { recursive: true, dereference: true });
  }
}

function flattenStandalone() {
  if (!fs.existsSync(STANDALONE)) {
    console.error(`\nErreur : standalone introuvable : ${STANDALONE}`);
    console.error("Lancez d'abord : pnpm --filter @notoflow/web build");
    process.exit(1);
  }

  // Nettoyer la destination
  if (fs.existsSync(FLAT_DIR)) {
    console.log(`  Nettoyage de standalone-flat...`);
    fs.rmSync(FLAT_DIR, { recursive: true, force: true });
  }

  console.log(`  Source : ${STANDALONE}`);
  console.log(`  Dest   : ${FLAT_DIR}`);
  console.log(`  Copie avec fs.cpSync (dereference symlinks)...`);

  fs.cpSync(STANDALONE, FLAT_DIR, {
    recursive: true,
    dereference: true,   // resout tous les symlinks pnpm -> vrais fichiers
    errorOnExist: false,
    preserveTimestamps: true,
  });

  // Copier les fichiers statiques Next.js (.next/static/)
  const staticSrc  = path.join(WEB_DIR, ".next", "static");
  const staticDest = path.join(FLAT_DIR, "apps", "web", ".next", "static");
  if (fs.existsSync(staticSrc)) {
    console.log(`  Copie des fichiers statiques...`);
    fs.cpSync(staticSrc, staticDest, { recursive: true, dereference: true });
  }

  // Copier public/
  const publicSrc  = path.join(WEB_DIR, "public");
  const publicDest = path.join(FLAT_DIR, "apps", "web", "public");
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, dereference: true });
  }

  // Hoisser les packages manquants dans apps/web/node_modules/
  // (packages que Next.js resout depuis son propre contexte, pas depuis la racine)
  console.log(`  Hoisting des packages manquants dans apps/web/node_modules/...`);
  hoistMissingPackages(FLAT_DIR);

  console.log(`  Standalone aplati dans : ${FLAT_DIR}`);
}

// ─── Etape 3 : Chiffrement du .env.local ─────────────────────────────────────
//
// Le .env.local est chiffre avec AES-256-GCM avant d'etre bundle.
// Cle derivee via scrypt depuis une constante + salt aleatoire.
// Au premier lancement Electron dechiffre -> stocke dans safeStorage -> supprime.
//
// La constante BUNDLE_KEY_MATERIAL doit etre identique dans config.ts.

const BUNDLE_KEY_MATERIAL = "notoflow-desktop-v1-com.notoflow.desktop";

function encryptEnvFile(envPath, outPath) {
  if (!fs.existsSync(envPath)) {
    console.warn(`  AVERTISSEMENT : .env.local introuvable : ${envPath}`);
    console.warn("  L'utilisateur devra configurer manuellement.");
    return false;
  }

  const plaintext = fs.readFileSync(envPath, "utf-8");
  const salt      = crypto.randomBytes(16);
  const iv        = crypto.randomBytes(12);
  const key       = crypto.scryptSync(BUNDLE_KEY_MATERIAL, salt, 32);

  const cipher    = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  // Format binaire : salt(16) | iv(12) | authTag(16) | ciphertext
  const bundle = Buffer.concat([salt, iv, authTag, encrypted]);
  fs.writeFileSync(outPath, bundle);

  const sizeKb = (bundle.length / 1024).toFixed(1);
  console.log(`  .env.local chiffre (${sizeKb} KB) -> ${path.relative(ROOT, outPath)}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(function main() {
  const TOTAL = 6;
  console.log("\nNotoFlow Desktop - Build Production\n");

  // 1. Build Next.js
  step(1, TOTAL, "Build Next.js (standalone)");
  run("pnpm --filter @notoflow/web build", ROOT);

  // 2. Aplatir le standalone (fs.cpSync dereference - pas de robocopy)
  step(2, TOTAL, "Aplatissement standalone (fs.cpSync dereference)");
  flattenStandalone();

  // 3. Chiffrer le .env.local
  step(3, TOTAL, "Chiffrement .env.local -> assets/env.enc");
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  encryptEnvFile(path.join(ROOT, ".env.local"), path.join(ASSETS_DIR, "env.enc"));

  // 4. Compiler TypeScript Electron
  step(4, TOTAL, "Compilation TypeScript Electron");
  run("pnpm --filter @notoflow/desktop build:electron", ROOT);

  // 5. Telecharger Node.js bundle
  step(5, TOTAL, "Telechargement Node.js v20 LTS");
  run("pnpm --filter @notoflow/desktop bundle:node", ROOT);

  // 6. electron-builder
  step(6, TOTAL, "electron-builder -> installeur Windows");
  run("pnpm --filter @notoflow/desktop dist:win", ROOT);

  console.log("\nBuild termine !");
  console.log(`   Installeur : ${path.join(DESKTOP_DIR, "release", "NotoFlow Setup 0.1.0.exe")}\n`);
})();
