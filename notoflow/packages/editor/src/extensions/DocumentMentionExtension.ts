import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface DocumentMentionOptions {
  /**
   * Appelé quand l'utilisateur tape @ suivi d'un texte.
   * Reçoit la query (texte après @), les coordonnées du curseur et un callback pour fermer.
   */
  onMentionQuery?: (params: {
    query: string;
    coords: { top: number; left: number; bottom: number; right: number };
    cancel: () => void;
  }) => void;
  /**
   * Appelé quand le menu @ doit être fermé (Escape, sélection, etc.)
   */
  onMentionClose?: () => void;
}

const MENTION_KEY = new PluginKey("documentMention");

/**
 * Extension TipTap qui détecte la frappe de "@" et déclenche un picker de documents.
 * Quand l'utilisateur tape "@" (optionnellement suivi d'un texte de recherche),
 * on appelle `onMentionQuery` avec la query et les coordonnées du curseur.
 * Quand l'utilisateur appuie sur Escape ou sélectionne un document, on appelle `onMentionClose`.
 */
export const DocumentMentionExtension = Extension.create<DocumentMentionOptions>({
  name: "documentMention",

  addOptions() {
    return {
      onMentionQuery: undefined,
      onMentionClose: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: MENTION_KEY,

        state: {
          init() {
            return { active: false, query: "" };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(MENTION_KEY);
            if (meta !== undefined) return meta;
            // Réinitialiser si la transaction modifie le doc (sélection ou insertion)
            if (tr.docChanged && prev.active) {
              return { active: false, query: "" };
            }
            return prev;
          },
        },

        props: {
          handleKeyDown(view, event) {
            const pluginState = MENTION_KEY.getState(view.state);

            // Fermer avec Escape
            if (event.key === "Escape" && pluginState?.active) {
              view.dispatch(
                view.state.tr.setMeta(MENTION_KEY, { active: false, query: "" }),
              );
              options.onMentionClose?.();
              return true;
            }

            return false;
          },

          handleTextInput(view, _from, _to, text) {
            const pluginState = MENTION_KEY.getState(view.state);

            // Détecter la frappe de "@"
            if (text === "@") {
              // Obtenir les coordonnées du curseur
              const { from } = view.state.selection;
              let coords = { top: 0, left: 0, bottom: 0, right: 0 };
              try {
                const domCoords = view.coordsAtPos(from);
                coords = {
                  top: domCoords.top,
                  left: domCoords.left,
                  bottom: domCoords.bottom,
                  right: domCoords.right,
                };
              } catch {
                // ignore
              }

              // Activer le mode mention
              view.dispatch(
                view.state.tr.setMeta(MENTION_KEY, { active: true, query: "" }),
              );

              options.onMentionQuery?.({
                query: "",
                coords,
                cancel: () => {
                  view.dispatch(
                    view.state.tr.setMeta(MENTION_KEY, { active: false, query: "" }),
                  );
                  options.onMentionClose?.();
                },
              });

              return false; // Laisser TipTap insérer le "@" normalement
            }

            // Si le menu est actif, mettre à jour la query
            if (pluginState?.active) {
              // Construire la nouvelle query en ajoutant le caractère tapé
              const newQuery = pluginState.query + text;

              // Vérifier si on a toujours un "@" juste avant le curseur
              const { from } = view.state.selection;
              const textBefore = view.state.doc.textBetween(
                Math.max(0, from - 30),
                from,
                "\n",
              );
              const match = textBefore.match(/@(\w*)$/);

              if (!match) {
                // Plus de "@" avant le curseur → fermer
                view.dispatch(
                  view.state.tr.setMeta(MENTION_KEY, { active: false, query: "" }),
                );
                options.onMentionClose?.();
                return false;
              }

              const currentQuery = match[1] + text;

              view.dispatch(
                view.state.tr.setMeta(MENTION_KEY, { active: true, query: currentQuery }),
              );

              // Obtenir les coordonnées actualisées
              let coords = { top: 0, left: 0, bottom: 0, right: 0 };
              try {
                const domCoords = view.coordsAtPos(from);
                coords = {
                  top: domCoords.top,
                  left: domCoords.left,
                  bottom: domCoords.bottom,
                  right: domCoords.right,
                };
              } catch {
                // ignore
              }

              options.onMentionQuery?.({
                query: currentQuery,
                coords,
                cancel: () => {
                  view.dispatch(
                    view.state.tr.setMeta(MENTION_KEY, { active: false, query: "" }),
                  );
                  options.onMentionClose?.();
                },
              });
            }

            return false;
          },
        },
      }),
    ];
  },
});
