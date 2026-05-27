/**
 * Serveur de production NotoFlow Desktop (Electron).
 * Lancé par Electron via node.exe bundlé.
 * Ce fichier est copié à la racine du standalone-flat par flatten-standalone.ps1.
 */

const { createServer } = require("http");
const { parse }        = require("url");
const path             = require("path");
const next             = require("next");

const port = parseInt(process.env.PORT || "3100", 10);
const dir  = __dirname; // racine du standalone-flat (contient .next/ et node_modules/)

const app    = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, "127.0.0.1", () => {
    console.log(`> NotoFlow ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error("Erreur démarrage Next.js :", err);
  process.exit(1);
});
