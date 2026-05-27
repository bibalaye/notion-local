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

// ─── Hoisting complet depuis .pnpm vers apps/web/node_modules/ ───────────────
//
// Problème : pnpm standalone monorepo ne hoisste pas les packages dans
// apps/web/node_modules/. Next.js (require-hook.js) résout ses dépendances
// depuis son propre contexte (apps/web/node_modules/), pas depuis la racine.
//
// Solution : copier TOUS les packages de .pnpm/*/node_modules/ vers
// apps/web/node_modules/ en une seule passe. Les packages déjà présents
// (next, react, etc.) sont ignorés. Les packages scopés (@swc/helpers, etc.)
// sont gérés via leur structure de dossier (@scope/name).
//
// C'est équivalent à ce que npm/yarn font nativement avec un node_modules plat.

function hoistAllPnpmPackages(flatDir) {
  const webNodeModules = path.join(flatDir, "apps", "web", "node_modules");
  const pnpmDir        = path.join(flatDir, "node_modules", ".pnpm");

  if (!fs.existsSync(pnpmDir)) {
    console.warn("  AVERTISSEMENT : .pnpm introuvable — hoisting ignoré");
    return;
  }

  let hoisted = 0;
  let skipped = 0;

  const pnpmEntries = fs.readdirSync(pnpmDir);

  for (const entry of pnpmEntries) {
    // Ignorer les dossiers spéciaux (.modules.yaml, node_modules hoisted, etc.)
    if (entry.startsWith(".")) continue;

    const pkgNodeModules = path.join(pnpmDir, entry, "node_modules");
    if (!fs.existsSync(pkgNodeModules)) continue;

    // Parcourir tous les packages dans ce node_modules
    const pkgEntries = fs.readdirSync(pkgNodeModules);

    for (const pkgEntry of pkgEntries) {
      // Ignorer .bin et autres dossiers spéciaux
      if (pkgEntry.startsWith(".")) continue;

      if (pkgEntry.startsWith("@")) {
        // Package scopé : @scope/name → deux niveaux
        const scopeDir = path.join(pkgNodeModules, pkgEntry);
        if (!fs.statSync(scopeDir).isDirectory()) continue;

        const scopedPkgs = fs.readdirSync(scopeDir);
        for (const scopedPkg of scopedPkgs) {
          if (scopedPkg.startsWith(".")) continue;
          const src  = path.join(scopeDir, scopedPkg);
          const dest = path.join(webNodeModules, pkgEntry, scopedPkg);
          if (fs.existsSync(dest)) { skipped++; continue; }
          // Créer le dossier scope si nécessaire
          const scopeDest = path.join(webNodeModules, pkgEntry);
          if (!fs.existsSync(scopeDest)) fs.mkdirSync(scopeDest, { recursive: true });
          fs.cpSync(src, dest, { recursive: true, dereference: true });
          hoisted++;
        }
      } else {
        // Package normal
        const src  = path.join(pkgNodeModules, pkgEntry);
        const dest = path.join(webNodeModules, pkgEntry);
        if (fs.existsSync(dest)) { skipped++; continue; }
        fs.cpSync(src, dest, { recursive: true, dereference: true });
        hoisted++;
      }
    }
  }

  console.log(`  Hoisting complet : ${hoisted} packages copiés, ${skipped} déjà présents`);
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

  // Hoisser TOUS les packages .pnpm dans apps/web/node_modules/
  // (Next.js résout ses dépendances depuis ce contexte, pas depuis la racine)
  console.log(`  Hoisting de tous les packages .pnpm vers apps/web/node_modules/...`);
  hoistAllPnpmPackages(FLAT_DIR);

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
