import TableCell from "@tiptap/extension-table-cell";

/**
 * Extension TableCell personnalisée avec support de backgroundColor et colwidth
 * Compatible avec TipTap 2.27.2
 */
export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      // Hériter des attributs existants (colspan, rowspan, colwidth, etc.)
      ...this.parent?.(),

      // Ajouter l'attribut backgroundColor pour la colorisation
      backgroundColor: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute("data-background-color") || element.style.backgroundColor || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {};
          }

          return {
            "data-background-color": attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});
