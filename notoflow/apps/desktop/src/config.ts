/**
 * Gestion sécurisée de la configuration NotoFlow Desktop.
 *
 * Flux au premier lancement (production) :
 *   1. Electron trouve assets/env.enc (bundlé au build, chiffré AES-256-GCM)
 *   2. Le déchiffre → parse les variables
 *   3. Stocke les secrets dans safeStorage (keychain OS)
 *   4. Stocke les variables publiques en JSON clair
 *   5. Supprime env.enc (plus besoin)
 *
 * Lancements suivants :
 *   - Lecture directe depuis safeStorage + public.json
 *   - Aucune interaction utilisateur requise
 *
 * En développement :
 *   - Lit directement le .env.local racine du monorepo (jamais bundlé)
 */

import { app, safeStorage } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
}

export interface SecretConfig {
  DATABASE_URL: string;
  MISTRAL_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
}

export type AppConfig = PublicConfig & SecretConfig;

// ─── Clé de dérivation (doit correspondre à build-prod.js) ───────────────────
// Cette constante est dans le code compilé (asar). Elle protège contre
// une extraction naïve du fichier env.enc, pas contre un attaquant déterminé.
const BUNDLE_KEY_MATERIAL = "notoflow-desktop-v1-com.notoflow.desktop";

// ─── Chemins ──────────────────────────────────────────────────────────────────

function getConfigDir(): string {
  return path.join(app.getPath("userData"), "config");
}

function getPublicConfigPath(): string {
  return path.join(getConfigDir(), "public.json");
}

function getSecretsPath(): string {
  return path.join(getConfigDir(), "secrets.enc");
}

function getBundledEnvPath(): string {
  // En production : assets/env.enc est dans le dossier buildResources → resources/assets/
  return path.join(process.resourcesPath, "assets", "env.enc");
}

function getManualEnvPath(): string {
  // Fallback : l'utilisateur peut déposer un .env.local dans userData/config/
  // Utile pour reconfigurer sans réinstaller l'app.
  return path.join(getConfigDir(), ".env.local");
}

// ─── Parse d'un fichier .env ──────────────────────────────────────────────────

function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value) result[key] = value;
  }
  return result;
}

// ─── Déchiffrement du env.enc bundlé ─────────────────────────────────────────

function decryptBundledEnv(encPath: string): Record<string, string> | null {
  if (!fs.existsSync(encPath)) return null;

  try {
    const bundle = fs.readFileSync(encPath);
    // Format : salt(16) + iv(12) + authTag(16) + ciphertext
    const salt      = bundle.subarray(0, 16);
    const iv        = bundle.subarray(16, 28);
    const authTag   = bundle.subarray(28, 44);
    const encrypted = bundle.subarray(44);

    const key = crypto.scryptSync(BUNDLE_KEY_MATERIAL, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return parseEnvContent(decrypted.toString("utf-8"));
  } catch (err) {
    console.error("[Config] Erreur déchiffrement env.enc :", err);
    return null;
  }
}

// ─── Stockage public (clair) ──────────────────────────────────────────────────

function readPublicConfig(): Partial<PublicConfig> {
  const p = getPublicConfigPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as Partial<PublicConfig>;
  } catch {
    return {};
  }
}

function writePublicConfig(config: Partial<PublicConfig>): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getPublicConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}

// ─── Stockage secrets (chiffré safeStorage) ───────────────────────────────────

function readSecrets(): Partial<SecretConfig> {
  const p = getSecretsPath();
  if (!fs.existsSync(p)) return {};
  if (!safeStorage.isEncryptionAvailable()) return {};
  try {
    const buf = fs.readFileSync(p);
    return JSON.parse(safeStorage.decryptString(buf)) as Partial<SecretConfig>;
  } catch {
    return {};
  }
}

function writeSecrets(secrets: Partial<SecretConfig>): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn("[Config] safeStorage indisponible — secrets non persistés");
    return;
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
  fs.writeFileSync(getSecretsPath(), encrypted);
}

// ─── Initialisation au premier lancement ─────────────────────────────────────

/**
 * Tente d'initialiser la config depuis le env.enc bundlé.
 * Si réussi, stocke dans safeStorage et supprime env.enc.
 * Retourne true si la config a été initialisée.
 */
function initFromBundledEnv(): boolean {
  const encPath = getBundledEnvPath();
  const parsed  = decryptBundledEnv(encPath);
  if (!parsed) return false;

  console.log("[Config] Initialisation depuis env.enc bundlé");

  const pub: Partial<PublicConfig> = {};
  const sec: Partial<SecretConfig> = {};

  if (parsed.NEXT_PUBLIC_SUPABASE_URL)    pub.NEXT_PUBLIC_SUPABASE_URL    = parsed.NEXT_PUBLIC_SUPABASE_URL;
  if (parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY) pub.NEXT_PUBLIC_SUPABASE_ANON_KEY = parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (parsed.NEXT_PUBLIC_APP_URL)         pub.NEXT_PUBLIC_APP_URL         = parsed.NEXT_PUBLIC_APP_URL;
  if (parsed.DATABASE_URL)                sec.DATABASE_URL                = parsed.DATABASE_URL;
  if (parsed.MISTRAL_API_KEY)             sec.MISTRAL_API_KEY             = parsed.MISTRAL_API_KEY;
  if (parsed.STRIPE_SECRET_KEY)           sec.STRIPE_SECRET_KEY           = parsed.STRIPE_SECRET_KEY;
  if (parsed.STRIPE_WEBHOOK_SECRET)       sec.STRIPE_WEBHOOK_SECRET       = parsed.STRIPE_WEBHOOK_SECRET;
  if (parsed.RESEND_API_KEY)              sec.RESEND_API_KEY              = parsed.RESEND_API_KEY;
  if (parsed.RESEND_FROM_EMAIL)           sec.RESEND_FROM_EMAIL           = parsed.RESEND_FROM_EMAIL;

  if (Object.keys(pub).length > 0) writePublicConfig(pub);
  if (Object.keys(sec).length > 0) writeSecrets(sec);

  // Supprimer env.enc après import réussi
  // Note : en production le fichier est dans resources/ (read-only sur certains OS)
  // On ne force pas la suppression — ce n'est pas critique car il est chiffré
  try {
    fs.unlinkSync(encPath);
    console.log("[Config] env.enc supprimé après import");
  } catch {
    // Silencieux — le fichier est chiffré, pas critique
  }

  return true;
}

// ─── Import depuis .env.local (dev + mise à jour manuelle) ───────────────────

export function importFromEnvFile(envFilePath: string): boolean {
  if (!fs.existsSync(envFilePath)) return false;
  try {
    const parsed = parseEnvContent(fs.readFileSync(envFilePath, "utf-8"));

    const pub: Partial<PublicConfig> = {};
    const sec: Partial<SecretConfig> = {};

    if (parsed.NEXT_PUBLIC_SUPABASE_URL)    pub.NEXT_PUBLIC_SUPABASE_URL    = parsed.NEXT_PUBLIC_SUPABASE_URL;
    if (parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY) pub.NEXT_PUBLIC_SUPABASE_ANON_KEY = parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (parsed.NEXT_PUBLIC_APP_URL)         pub.NEXT_PUBLIC_APP_URL         = parsed.NEXT_PUBLIC_APP_URL;
    if (parsed.DATABASE_URL)                sec.DATABASE_URL                = parsed.DATABASE_URL;
    if (parsed.MISTRAL_API_KEY)             sec.MISTRAL_API_KEY             = parsed.MISTRAL_API_KEY;
    if (parsed.STRIPE_SECRET_KEY)           sec.STRIPE_SECRET_KEY           = parsed.STRIPE_SECRET_KEY;
    if (parsed.STRIPE_WEBHOOK_SECRET)       sec.STRIPE_WEBHOOK_SECRET       = parsed.STRIPE_WEBHOOK_SECRET;
    if (parsed.RESEND_API_KEY)              sec.RESEND_API_KEY              = parsed.RESEND_API_KEY;
    if (parsed.RESEND_FROM_EMAIL)           sec.RESEND_FROM_EMAIL           = parsed.RESEND_FROM_EMAIL;

    if (Object.keys(pub).length > 0) writePublicConfig(pub);
    if (Object.keys(sec).length > 0) writeSecrets(sec);

    console.log("[Config] Import .env.local réussi");
    return true;
  } catch (err) {
    console.error("[Config] Erreur import .env.local :", err);
    return false;
  }
}

// ─── Chargement complet ───────────────────────────────────────────────────────

export function loadConfig(): Partial<AppConfig> {
  return { ...readPublicConfig(), ...readSecrets() };
}

// ─── Vérification complétude ──────────────────────────────────────────────────

const REQUIRED_KEYS: (keyof AppConfig)[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
];

export function isConfigComplete(config: Partial<AppConfig>): boolean {
  return REQUIRED_KEYS.every((key) => !!config[key]);
}

// ─── Point d'entrée principal ─────────────────────────────────────────────────

/**
 * Charge la configuration complète.
 * En production : tente d'abord env.enc bundlé, puis safeStorage, puis .env.local manuel.
 * En dev : lit le .env.local racine directement.
 */
export function initConfig(isDev: boolean, monorepoRoot?: string): Partial<AppConfig> {
  if (isDev && monorepoRoot) {
    const envPath = path.join(monorepoRoot, ".env.local");
    console.log(`[Config] Mode dev — lecture de : ${envPath}`);
    if (fs.existsSync(envPath)) {
      importFromEnvFile(envPath);
    } else {
      console.warn(`[Config] .env.local introuvable : ${envPath}`);
    }
    return loadConfig();
  }

  // Production — ordre de priorité :
  // 1. env.enc bundlé dans resources/assets/ (premier lancement / réinstall)
  const encPath = getBundledEnvPath();
  console.log(`[Config] Recherche env.enc : ${encPath}`);
  if (fs.existsSync(encPath)) {
    console.log("[Config] env.enc trouvé — déchiffrement...");
    const ok = initFromBundledEnv();
    console.log(`[Config] initFromBundledEnv : ${ok ? "OK" : "ECHEC"}`);
  } else {
    console.log("[Config] env.enc absent — lecture safeStorage...");
  }

  // 2. .env.local déposé manuellement dans userData/config/ (fallback reconfiguration)
  const manualEnv = getManualEnvPath();
  if (fs.existsSync(manualEnv)) {
    console.log(`[Config] .env.local manuel trouvé : ${manualEnv}`);
    importFromEnvFile(manualEnv);
    // Supprimer après import pour ne pas laisser les secrets en clair
    try {
      fs.unlinkSync(manualEnv);
      console.log("[Config] .env.local manuel supprimé après import");
    } catch {
      // Silencieux
    }
  }

  const config = loadConfig();
  const keys = Object.keys(config);
  console.log(`[Config] Clés disponibles après init : ${keys.length > 0 ? keys.join(", ") : "aucune"}`);

  if (keys.length === 0) {
    console.error("[Config] AUCUNE CLE CHARGEE — env.enc absent et safeStorage vide.");
    console.error(`[Config] Pour reconfigurer : deposer un .env.local dans ${getConfigDir()}`);
  }

  return config;
}

// ─── Injection dans le processus Next.js ─────────────────────────────────────

export function buildEnvForNextServer(
  config: Partial<AppConfig>,
  port: number,
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...(config.DATABASE_URL                && { DATABASE_URL:                config.DATABASE_URL }),
    ...(config.NEXT_PUBLIC_SUPABASE_URL    && { NEXT_PUBLIC_SUPABASE_URL:    config.NEXT_PUBLIC_SUPABASE_URL }),
    ...(config.NEXT_PUBLIC_SUPABASE_ANON_KEY && { NEXT_PUBLIC_SUPABASE_ANON_KEY: config.NEXT_PUBLIC_SUPABASE_ANON_KEY }),
    ...(config.MISTRAL_API_KEY             && { MISTRAL_API_KEY:             config.MISTRAL_API_KEY }),
    ...(config.STRIPE_SECRET_KEY           && { STRIPE_SECRET_KEY:           config.STRIPE_SECRET_KEY }),
    ...(config.STRIPE_WEBHOOK_SECRET       && { STRIPE_WEBHOOK_SECRET:       config.STRIPE_WEBHOOK_SECRET }),
    ...(config.RESEND_API_KEY              && { RESEND_API_KEY:              config.RESEND_API_KEY }),
    ...(config.RESEND_FROM_EMAIL           && { RESEND_FROM_EMAIL:           config.RESEND_FROM_EMAIL }),
    PORT:                     String(port),
    NODE_ENV:                 "production",
    NEXT_PUBLIC_APP_URL:      `http://localhost:${port}`,
    NEXT_TELEMETRY_DISABLED:  "1",
  };
}
