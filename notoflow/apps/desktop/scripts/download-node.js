/**
 * Télécharge le binaire Node.js LTS pour la plateforme courante
 * et le place dans apps/desktop/bundled-node/
 *
 * Utilisé par electron-builder pour bundler node.exe dans les resources.
 * Cela permet à Electron de lancer le serveur Next.js avec un vrai Node.js
 * (le Node.js interne d'Electron n'est pas compatible avec tous les modules).
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Version Node.js LTS à bundler (doit correspondre à la version utilisée pour le build)
const NODE_VERSION = "20.19.2";
const OUTPUT_DIR = path.join(__dirname, "..", "bundled-node");

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Téléchargement : ${url}`);
    const file = fs.createWriteStream(dest);

    const request = (reqUrl) => {
      https.get(reqUrl, (res) => {
        // Suivre les redirections
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} pour ${reqUrl}`));
          return;
        }
        const total = parseInt(res.headers["content-length"] || "0", 10);
        let downloaded = 0;
        res.on("data", (chunk) => {
          downloaded += chunk.length;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            process.stdout.write(`\r  ${pct}% (${Math.round(downloaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`);
          }
        });
        res.pipe(file);
        file.on("finish", () => {
          console.log("");
          file.close(resolve);
        });
      }).on("error", reject);
    };

    request(url);
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const platform = process.platform;

  if (platform === "win32") {
    const nodeExe = path.join(OUTPUT_DIR, "node.exe");

    // Vérifier si déjà téléchargé et à la bonne version
    if (fs.existsSync(nodeExe)) {
      try {
        const version = execSync(`"${nodeExe}" --version`).toString().trim();
        if (version === `v${NODE_VERSION}`) {
          console.log(`✓ Node.js ${version} déjà présent dans bundled-node/`);
          return;
        }
      } catch {}
    }

    const url = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;
    const zipPath = path.join(OUTPUT_DIR, "node.zip");

    console.log(`Téléchargement Node.js v${NODE_VERSION} pour Windows x64...`);
    await download(url, zipPath);

    console.log("Extraction...");
    // Utiliser PowerShell pour extraire le zip
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${OUTPUT_DIR}' -Force"`,
    );

    // Déplacer node.exe à la racine de bundled-node/
    const extractedDir = path.join(OUTPUT_DIR, `node-v${NODE_VERSION}-win-x64`);
    const extractedNode = path.join(extractedDir, "node.exe");

    if (fs.existsSync(extractedNode)) {
      fs.copyFileSync(extractedNode, nodeExe);
      // Nettoyer
      fs.rmSync(extractedDir, { recursive: true, force: true });
      fs.unlinkSync(zipPath);
      console.log(`✓ Node.js v${NODE_VERSION} bundlé dans bundled-node/node.exe`);
    } else {
      throw new Error(`node.exe introuvable après extraction dans ${extractedDir}`);
    }
  } else if (platform === "darwin") {
    const nodeBin = path.join(OUTPUT_DIR, "node");
    const arch = process.arch === "arm64" ? "arm64" : "x64";
    const url = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-${arch}.tar.gz`;
    const tarPath = path.join(OUTPUT_DIR, "node.tar.gz");

    if (fs.existsSync(nodeBin)) {
      try {
        const version = execSync(`"${nodeBin}" --version`).toString().trim();
        if (version === `v${NODE_VERSION}`) {
          console.log(`✓ Node.js ${version} déjà présent`);
          return;
        }
      } catch {}
    }

    console.log(`Téléchargement Node.js v${NODE_VERSION} pour macOS ${arch}...`);
    await download(url, tarPath);
    execSync(`tar -xzf "${tarPath}" -C "${OUTPUT_DIR}"`);
    const extractedNode = path.join(OUTPUT_DIR, `node-v${NODE_VERSION}-darwin-${arch}`, "bin", "node");
    fs.copyFileSync(extractedNode, nodeBin);
    fs.chmodSync(nodeBin, 0o755);
    fs.rmSync(path.join(OUTPUT_DIR, `node-v${NODE_VERSION}-darwin-${arch}`), { recursive: true });
    fs.unlinkSync(tarPath);
    console.log(`✓ Node.js v${NODE_VERSION} bundlé dans bundled-node/node`);
  } else {
    // Linux
    const nodeBin = path.join(OUTPUT_DIR, "node");
    const url = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz`;
    const tarPath = path.join(OUTPUT_DIR, "node.tar.gz");

    if (fs.existsSync(nodeBin)) {
      try {
        const version = execSync(`"${nodeBin}" --version`).toString().trim();
        if (version === `v${NODE_VERSION}`) {
          console.log(`✓ Node.js ${version} déjà présent`);
          return;
        }
      } catch {}
    }

    console.log(`Téléchargement Node.js v${NODE_VERSION} pour Linux x64...`);
    await download(url, tarPath);
    execSync(`tar -xzf "${tarPath}" -C "${OUTPUT_DIR}"`);
    const extractedNode = path.join(OUTPUT_DIR, `node-v${NODE_VERSION}-linux-x64`, "bin", "node");
    fs.copyFileSync(extractedNode, nodeBin);
    fs.chmodSync(nodeBin, 0o755);
    fs.rmSync(path.join(OUTPUT_DIR, `node-v${NODE_VERSION}-linux-x64`), { recursive: true });
    fs.unlinkSync(tarPath);
    console.log(`✓ Node.js v${NODE_VERSION} bundlé dans bundled-node/node`);
  }
}

main().catch((err) => {
  console.error("Erreur download-node :", err);
  process.exit(1);
});
