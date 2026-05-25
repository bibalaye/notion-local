import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

const calloutTones = {
  gray: "notion-callout-gray",
  blue: "notion-callout-blue",
  green: "notion-callout-green",
  yellow: "notion-callout-yellow",
  red: "notion-callout-red",
  purple: "notion-callout-purple",
};

function CalloutBlockView(props: any) {
  const tone = props.node.attrs.tone as keyof typeof calloutTones;
  const emoji = props.node.attrs.emoji || "!";

  return (
    <NodeViewWrapper
      className={`notion-callout ${calloutTones[tone] ?? calloutTones.gray}`}
      data-drag-handle
    >
      <button
        type="button"
        className="notion-callout-icon"
        contentEditable={false}
        onClick={() => {
          const nextEmoji = window.prompt("Icone de l'encadre", emoji);
          if (nextEmoji) props.updateAttributes({ emoji: nextEmoji.slice(0, 4) });
        }}
        title="Changer l'icone"
      >
        {emoji}
      </button>
      <div className="notion-callout-body">
        <div className="notion-callout-colors" contentEditable={false}>
          {Object.keys(calloutTones).map((color) => (
            <button
              key={color}
              type="button"
              className={`notion-callout-color ${color === tone ? "is-active" : ""} ${
                calloutTones[color as keyof typeof calloutTones]
              }`}
              onClick={() => props.updateAttributes({ tone: color })}
              title={`Couleur ${color}`}
            />
          ))}
        </div>
        <NodeViewContent className="notion-callout-content" />
      </div>
    </NodeViewWrapper>
  );
}

const CalloutBlockNode = Node.create({
  name: "calloutBlock",
  group: "block",
  content: "block+",
  defining: true,
  isolating: false,

  addAttributes() {
    return {
      emoji: {
        default: "!",
      },
      tone: {
        default: "gray",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout-block",
        class: `notion-callout ${calloutTones[HTMLAttributes.tone as keyof typeof calloutTones] ?? calloutTones.gray}`,
      }),
      ["div", { class: "notion-callout-icon" }, HTMLAttributes.emoji || "!"],
      ["div", { class: "notion-callout-content" }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockView);
  },
});

export default CalloutBlockNode;
