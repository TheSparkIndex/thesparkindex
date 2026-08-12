import { Node, mergeAttributes } from "@tiptap/core";

export const PullQuote = Node.create({
  name: "pullQuote",

  group: "block",

  content: "inline*",

  defining: true,

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-author"),
        renderHTML: (attributes) => {
          if (!attributes.author) return {};
          return { "data-author": attributes.author };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "blockquote[data-pullquote]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const hasAuthor = typeof node.attrs.author === "string" && node.attrs.author.length > 0;
    return [
      "blockquote",
      mergeAttributes(HTMLAttributes, { "data-pullquote": "true", class: "pull-quote" }),
      ["div", 0],
      ...(hasAuthor ? [["footer", { "data-author": node.attrs.author }, ["cite", node.attrs.author]]] : []),
    ];
  },

  addCommands() {
    return {
      setPullQuote:
        (author?: string) =>
        ({ commands }) => {
          return commands.toggleNode("pullQuote", "paragraph", { author: author ?? null });
        },
      unsetPullQuote:
        () =>
        ({ commands }) => {
          return commands.setNode("paragraph");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-q": () => this.editor.commands.setPullQuote(),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pullQuote: {
      setPullQuote: (author?: string) => ReturnType;
      unsetPullQuote: () => ReturnType;
    };
  }
}
