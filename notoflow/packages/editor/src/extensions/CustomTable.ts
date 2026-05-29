import Table from "@tiptap/extension-table";

/**
 * Extension Table personnalisée avec support de borderColor et a/sans bordures.
 * Compatible avec TipTap 2
 */
export const CustomTable = Table.extend({
  addAttributes() {
    return {
      // Conserver les attributs parents
      ...this.parent?.(),

      // Couleur de bordure personnalisée
      borderColor: {
        default: null,
        parseHTML: (element) => {
          return (
            element.getAttribute("data-border-color") ||
            element.style.getPropertyValue("--table-border-color") ||
            null
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.borderColor) {
            return {};
          }
          return {
            "data-border-color": attributes.borderColor,
            style: `--table-border-color: ${attributes.borderColor}`,
          };
        },
      },

      // Affichage ou non des bordures
      hasBorders: {
        default: true,
        parseHTML: (element) => {
          const val = element.getAttribute("data-has-borders");
          return val === null ? true : val === "true";
        },
        renderHTML: (attributes) => {
          if (attributes.hasBorders === false) {
            return {
              "data-has-borders": "false",
              class: "no-borders",
            };
          }
          return {
            "data-has-borders": "true",
          };
        },
      },
    };
  },
});
