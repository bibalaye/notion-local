import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import CalloutBlockNode from "./CalloutBlockNode";
import DatabaseBlockNode from "./DatabaseBlockNode";

export const getExtensions = (options?: { renderDatabase?: (id: string) => React.ReactNode }) => {
  const extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Placeholder.configure({ placeholder: "Tape '/' pour les commandes…" }),
    TextStyle,
    Color,
    Underline,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "text-primary underline" },
    }),
    Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
    Youtube.configure({ HTMLAttributes: { class: "rounded-lg" } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CalloutBlockNode,
    DatabaseBlockNode ? DatabaseBlockNode.configure({
      renderDatabase: options?.renderDatabase,
    }) : undefined,
  ];

  extensions.forEach((ext, i) => {
    if (!ext) {
      console.warn(`[getExtensions] Warning: Extension at index ${i} is undefined!`);
    }
  });

  return extensions.filter(Boolean) as any[];
};
