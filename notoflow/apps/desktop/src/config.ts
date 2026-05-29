/**
 * config.ts — Configuration de l'URL de l'application NotoFlow Desktop.
 *
 * Architecture simplifiée (Vercel) :
 *  - En production : l'app charge directement https://notion-local-one.vercel.app/
 *    Aucun serveur local, aucune variable d'environnement à gérer.
 *  - En développement : charge http://localhost:3000 (serveur Next.js local)
 *
 * Bonnes pratiques Electron (skill) :
 *  - Pas de secrets dans le processus renderer
 *  - URL de production hardcodée dans le code compilé (asar)
 *  - Possibilité de surcharger l'URL via variable d'env en dev
 */

import { app } from "electron";

// ─── Constantes ────────────────────────────────────────────────────────────────

/** URL de production hébergée sur Vercel */
export const PROD_URL = "https://notion-local-one.vercel.app";

/** URL du serveur de développement local */
export const DEV_URL = process.env.NEXT_DEV_URL ?? "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

/**
 * Retourne l'URL à charger dans la fenêtre principale.
 * - Dev  : localhost:3000 (ou NEXT_DEV_URL si défini)
 * - Prod : URL Vercel
 */
export function getAppUrl(): string {
  return isDev ? DEV_URL : PROD_URL;
}
