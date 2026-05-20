import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

export interface DatabaseBlockOptions {
  renderDatabase?: (databaseId: string) => React.ReactNode;
}

const DatabaseBlockComponent = ({ node, editor }: any) => {
  const databaseId = node.attrs.databaseId;
  const renderDatabase = editor.storage.databaseBlock?.renderDatabase;

  return (
    <NodeViewWrapper className="my-4 outline-none">
      {renderDatabase ? (
        renderDatabase(databaseId)
      ) : (
        <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground font-medium">
          Base de données : {databaseId}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const DatabaseBlockNode = Node.create<DatabaseBlockOptions>({
  name: "databaseBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      databaseId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type=database-block]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "database-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockComponent);
  },

  addStorage() {
    return {
      renderDatabase: undefined,
    };
  },

  onCreate() {
    this.storage.renderDatabase = this.options.renderDatabase;
  },
});
export default DatabaseBlockNode;
