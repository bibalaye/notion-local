# Guide de Configuration et Utilisation du Connecteur MCP NotoFlow

Ce guide vous explique comment connecter votre espace de travail NotoFlow à des applications d'intelligence artificielle externes (telles que **Cursor**, **Windsurf**, ou **Claude Desktop**) en utilisant le protocole **Model Context Protocol (MCP)** via le transport **Server-Sent Events (SSE)**.

---

## Qu'est-ce que MCP ?

Le **Model Context Protocol (MCP)** est un standard ouvert qui permet aux modèles de langage (LLM) d'accéder de manière sécurisée à des données et outils locaux ou distants. Grâce au connecteur MCP de NotoFlow, votre IA préférée peut lire, créer, modifier ou archiver des pages directement dans votre application NotoFlow.

---

## Étape 1 : Générer votre clé d'API NotoFlow

Avant de configurer vos applications d'IA, vous devez générer un jeton d'accès sécurisé :

1. Ouvrez votre application NotoFlow (généralement accessible sur `http://localhost:3000` ou `http://localhost:3002`).
2. Accédez à la page des **Paramètres** (Settings) via la barre latérale.
3. Cliquez sur l'onglet **Développeurs (API / MCP)**.
4. Saisissez un nom descriptif pour votre clé (par exemple : `Cursor AI`) et cliquez sur **Générer**.
5. Copiez la clé d'API générée (format `ntf_...`) ou l'**URL de connexion MCP** complète fournie.

---

## Étape 2 : Configurer vos applications d'IA

### 1. Configuration dans Cursor

Cursor intègre un support natif pour les serveurs MCP de type SSE.

1. Ouvrez les **Settings** de Cursor (icône d'engrenage en haut à droite).
2. Allez dans la section **Features** &rarr; **MCP**.
3. Cliquez sur **+ Add New MCP Server**.
4. Remplissez les champs de la boîte de dialogue :
   - **Name** : `NotoFlow`
   - **Type** : `sse`
   - **URL** : `http://localhost:3000/api/mcp?token=VOTRE_CLE_API` *(remplacez par l'URL copiée dans vos paramètres NotoFlow, en ajustant le port si nécessaire, par exemple `3001` ou `3002`)*.
5. Cliquez sur **Save**. L'indicateur devrait passer au **vert** (Connected).

---

### 2. Configuration dans Windsurf

Windsurf supporte également le protocole SSE.

1. Ouvrez les paramètres de Windsurf.
2. Accédez à la section **Advanced** / **AI Tools** &rarr; **MCP**.
3. Ajoutez une nouvelle configuration :
   - **Name** : `NotoFlow`
   - **Type** : `SSE`
   - **Endpoint** / **URL** : `http://localhost:3000/api/mcp?token=VOTRE_CLE_API`.
4. Sauvegardez la connexion.

---

### 3. Configuration dans Claude Desktop

Pour l'application de bureau officielle Claude, vous devez modifier son fichier de configuration JSON.

1. Ouvrez le dossier de configuration de Claude Desktop sur votre système :
   - **Windows** : Saisissez `%APPDATA%\Claude` dans la barre d'adresse de l'explorateur de fichiers.
   - **macOS** : Ouvrez le Finder, appuyez sur `Cmd+Shift+G` et saisissez `~/Library/Application Support/Claude`.
2. Ouvrez (ou créez) le fichier `claude_desktop_config.json`.
3. Ajoutez la configuration NotoFlow sous la clé `mcpServers` :

```json
{
  "mcpServers": {
    "notoflow": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:3000/api/mcp?token=VOTRE_CLE_API"
      ]
    }
  }
}
```

4. Enregistrez le fichier et **redémarrez complètement Claude Desktop**. Une icône de prise (plug) apparaîtra pour confirmer la connexion.

---

## Étape 3 : Liste des outils disponibles pour l'IA

Une fois connecté, l'assistant IA de votre éditeur aura accès aux outils suivants :

| Outil | Paramètres | Description |
| :--- | :--- | :--- |
| `list_pages` | Aucun | Liste toutes les pages actives de votre espace de travail. |
| `get_page` | `pageId` (string) | Lit le titre et le contenu textuel d'une page NotoFlow. |
| `create_page` | `title` (string), `content` (string), `parentId` (string, optionnel) | Crée une nouvelle page dans votre workspace. |
| `update_page` | `pageId` (string), `title` (string, optionnel), `content` (string, optionnel) | Modifie le titre et/ou le contenu d'une page existante. |
| `delete_page` | `pageId` (string) | Archive (envoie à la corbeille) la page sélectionnée. |

---

## Étape 4 : Exemples d'invites (Prompts) à tester avec votre IA

Vous pouvez interagir naturellement avec vos documents NotoFlow à l'aide de commandes simples :

- **Lister vos documents** :
  > "Peux-tu lister toutes mes pages présentes dans mon espace NotoFlow ?"
  
- **Consulter une page** :
  > "Lis le contenu de ma page de projet 'Roadmap 2026' et résume-moi les trois points clés."
  
- **Créer une page** :
  > "Crée une nouvelle page intitulée 'Compte-rendu du 24 Mai' avec le contenu suivant : discussion sur l'intégration de Notion et le serveur MCP."
  
- **Mettre à jour du contenu** :
  > "Ajoute une section 'Prochaines étapes' à la fin de ma page d'idées."
