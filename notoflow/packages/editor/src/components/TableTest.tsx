"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { getExtensions } from "../extensions";
import { useState } from "react";

/**
 * Composant de test pour vérifier les fonctionnalités des tableaux
 * Basé sur l'exemple officiel TipTap
 */
export function TableTest() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const editor = useEditor({
    extensions: getExtensions(),
    content: `
      <h3>Test des Tableaux TipTap</h3>
      <p>Utilisez les boutons ci-dessous pour tester les fonctionnalités.</p>
      <table>
        <tbody>
          <tr>
            <th colwidth="200">Nom</th>
            <th colspan="2">Description</th>
          </tr>
          <tr>
            <td>Marie Curie</td>
            <td>Scientifique</td>
            <td>Physicienne</td>
          </tr>
          <tr>
            <td>Ada Lovelace</td>
            <td>Mathématicienne</td>
            <td>Programmeuse</td>
          </tr>
        </tbody>
      </table>
    `,
    shouldRerenderOnTransaction: true,
    onUpdate: () => {
      addLog("Contenu mis à jour");
    },
  });

  if (!editor) {
    return <div>Chargement de l'éditeur...</div>;
  }

  const testCellColor = (color: string) => {
    const canSet = editor.can().setCellAttribute("backgroundColor", color);
    addLog(`Can set backgroundColor to ${color}: ${canSet}`);
    
    if (canSet) {
      editor.chain().focus().setCellAttribute("backgroundColor", color).run();
      addLog(`✅ Couleur appliquée: ${color}`);
    } else {
      addLog(`❌ Impossible d'appliquer la couleur (pas dans une cellule?)`);
    }
  };

  const testColwidth = (width: number) => {
    const canSet = editor.can().setCellAttribute("colwidth", [width]);
    addLog(`Can set colwidth to ${width}: ${canSet}`);
    
    if (canSet) {
      editor.chain().focus().setCellAttribute("colwidth", [width]).run();
      addLog(`✅ Largeur appliquée: ${width}px`);
    } else {
      addLog(`❌ Impossible d'appliquer la largeur`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test des Tableaux</h1>

      {/* Contrôles de test */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Contrôles de Test</h2>
        
        <div className="space-y-4">
          {/* Test des couleurs */}
          <div>
            <h3 className="font-medium mb-2">Test des Couleurs</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => testCellColor("#eff6ff")}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
              >
                Bleu clair
              </button>
              <button
                onClick={() => testCellColor("#dcfce7")}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded"
              >
                Vert clair
              </button>
              <button
                onClick={() => testCellColor("#fef9c3")}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded"
              >
                Jaune
              </button>
              <button
                onClick={() => testCellColor("#fee2e2")}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded"
              >
                Rouge clair
              </button>
              <button
                onClick={() => testCellColor(null as any)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Test des largeurs */}
          <div>
            <h3 className="font-medium mb-2">Test des Largeurs</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => testColwidth(100)}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded"
              >
                100px
              </button>
              <button
                onClick={() => testColwidth(150)}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded"
              >
                150px
              </button>
              <button
                onClick={() => testColwidth(200)}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded"
              >
                200px
              </button>
              <button
                onClick={() => testColwidth(300)}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded"
              >
                300px
              </button>
            </div>
          </div>

          {/* Actions de tableau */}
          <div>
            <h3 className="font-medium mb-2">Actions de Tableau</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  addLog("✅ Tableau inséré");
                }}
                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded"
              >
                Insérer tableau
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                  addLog("✅ Colonne ajoutée avant");
                }}
                disabled={!editor.can().addColumnBefore()}
                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded disabled:opacity-50"
              >
                Ajouter colonne avant
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                  addLog("✅ Ligne ajoutée après");
                }}
                disabled={!editor.can().addRowAfter()}
                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded disabled:opacity-50"
              >
                Ajouter ligne après
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().mergeCells().run();
                  addLog("✅ Cellules fusionnées");
                }}
                disabled={!editor.can().mergeCells()}
                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded disabled:opacity-50"
              >
                Fusionner cellules
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeaderRow().run();
                  addLog("✅ En-tête de ligne toggleé");
                }}
                disabled={!editor.can().toggleHeaderRow()}
                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded disabled:opacity-50"
              >
                Toggle en-tête ligne
              </button>
            </div>
          </div>

          {/* Bouton pour vider les logs */}
          <div>
            <button
              onClick={() => setLog([])}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
            >
              Vider les logs
            </button>
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <div className="mb-6 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <EditorContent editor={editor} />
      </div>

      {/* Console de logs */}
      <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm h-64 overflow-y-auto">
        <div className="font-bold mb-2">📋 Console de Logs</div>
        {log.length === 0 ? (
          <div className="text-gray-500">Aucun log pour le moment...</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="mb-1">
              {entry}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold mb-2">📖 Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Cliquez dans une cellule du tableau</li>
          <li>Utilisez les boutons de test ci-dessus</li>
          <li>Observez les logs pour voir si les commandes fonctionnent</li>
          <li>Vérifiez visuellement que les changements sont appliqués</li>
        </ol>
      </div>
    </div>
  );
}
