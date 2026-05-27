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

## Sécurité — Gestion des variables d'environnement

### Principe

Les secrets ne sont **jamais** bundlés dans l'installeur. Voici comment chaque type de variable est géré :

| Variable | Type | Stockage |
|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Publique | `AppData/NotoFlow/config/public.json` (clair) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publique | `AppData/NotoFlow/config/public.json` (clair) |
| `DATABASE_URL` | **Secret** | `AppData/NotoFlow/config/secrets.enc` (chiffré) |
| `MISTRAL_API_KEY` | **Secret** | `AppData/NotoFlow/config/secrets.enc` (chiffré) |
| `STRIPE_SECRET_KEY` | **Secret** | `AppData/NotoFlow/config/secrets.enc` (chiffré) |
| `RESEND_API_KEY` | **Secret** | `AppData/NotoFlow/config/secrets.enc` (chiffré) |

### Chiffrement

Les secrets utilisent `safeStorage` d'Electron qui délègue au **keychain OS** :
- Windows : DPAPI (Data Protection API) — lié au compte Windows
- macOS : Keychain
- Linux : libsecret / kwallet

Le fichier `secrets.enc` est illisible sans le compte OS de l'utilisateur.

### Premier lancement (production)

Si aucune config n'est trouvée, l'app :
1. Affiche un dialogue d'erreur avec le chemin du dossier de config
2. Crée un fichier `.env.local` exemple dans `AppData/NotoFlow/config/`
3. Ouvre ce dossier dans l'explorateur

L'utilisateur remplit le `.env.local`, relance l'app — les secrets sont importés, chiffrés, puis le `.env.local` peut être supprimé.

### En développement

Le `.env.local` à la racine du monorepo est automatiquement importé et chiffré au démarrage. Il n'est jamais copié dans le build.



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
