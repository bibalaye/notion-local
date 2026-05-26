# @notoflow/desktop

Application desktop NotoFlow — Electron wrappant l'app Next.js.

## Architecture

```
apps/desktop/
├── src/
│   ├── main.ts        # Processus principal Electron
│   ├── preload.ts     # Bridge sécurisé (contextBridge)
│   └── electron.d.ts  # Types globaux window.electron
├── assets/            # Icônes (icon.ico, icon.icns, icon.png)
├── dist/              # TypeScript compilé (gitignored)
├── release/           # Installeurs générés (gitignored)
├── package.json
└── tsconfig.electron.json
```

## Développement

```bash
# Depuis la racine du monorepo
pnpm desktop:dev
```

Cela lance :
1. Le serveur Next.js sur `http://localhost:3000`
2. Electron qui charge cette URL une fois le serveur prêt

## Build & Distribution

```bash
# Build complet (Next.js standalone + Electron)
pnpm desktop:build

# Générer l'installeur pour la plateforme courante
pnpm desktop:dist

# Cibler une plateforme spécifique
pnpm desktop:dist:win    # Windows (.exe NSIS)
pnpm desktop:dist:mac    # macOS (.dmg)
pnpm desktop:dist:linux  # Linux (.AppImage + .deb)
```

## Icônes requises

Placer dans `apps/desktop/assets/` :
- `icon.ico` — Windows (256×256 recommandé)
- `icon.icns` — macOS
- `icon.png` — Linux (512×512 recommandé)

## Fonctionnalités desktop

- **Titlebar custom** (Windows/Linux) avec contrôles Minimize/Maximize/Close
- **Traffic lights natifs** sur macOS (`titleBarStyle: hiddenInset`)
- **Tray icon** avec menu contextuel
- **Menu natif** avec raccourcis clavier (Cmd/Ctrl+N pour nouvelle page)
- **Liens externes** ouverts dans le navigateur système
- **Serveur Next.js embarqué** en production (mode standalone)
- **DevTools** ouverts automatiquement en développement

## API window.electron

Disponible côté Next.js via le hook `useElectron` :

```ts
import { useElectron } from "@/lib/hooks/useElectron";

const { isElectron, platform, minimize, maximize, close, openExternal } = useElectron();
```
