import { bundledLanguages } from "shiki";
import { shikiLazyPlugin } from "./CodeBlockExtension";
import {
  createBlockSpecFromStronglyTypedTiptapNode,
  createStronglyTypedTiptapNode,
} from "../../schema";

import { textblockTypeInputRule } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { createDefaultBlockDOMOutputSpec } from "../defaultBlockHelpers";
import {
  getArrowDownIcon,
  handleArrowKeysPress,
  isInCodeBlock,
} from "./CodeBLockHelpers";
import { getBlockInfoFromPos } from "../../api/getBlockInfoFromPos";

const defaultLanguage = "javascript";

export const CodeBlockPropSchema = {
  language: {
    default: defaultLanguage,
    values: Object.keys(bundledLanguages),
  },
};

/**
 * Matches a code block with backticks.
 */
export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;

export const CodeBlockContent = createStronglyTypedTiptapNode({
  name: "codeBlock",
  addOptions() {
    return {
      // TODO: Options
      HTMLAttributes: {},
    };
  },

  content: "inline*",
  marks: "",

  group: "blockContent",
  code: true,
  isolating: true,
  defining: true,
  selectable: true,

  addAttributes() {
    return {
      language: {
        default: defaultLanguage,
        parseHTML: (element) => {
          const language = element.getAttribute("data-language");

          if (!language) {
            return null;
          }

          return language;
        },
        rendered: false,
      },
      showSelector: {
        default: false,
        rendered: false,
      },
      lockSelector: {
        default: false,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
      this.name,
      "pre",
      {
        ...(this.options.domAttributes?.blockContent || {}),
        ...HTMLAttributes,
      },
      {
        ...(this.options.domAttributes?.inlineContent || {}),
        "data-language": node.attrs.language || "",
      }
    );

    const element = document.createElement("code");
    element.classList.add("language-" + node.attrs.language || "");

    contentDOM.appendChild(element);

    return {
      dom,
      contentDOM: element,
    };
  },

  // TODO commands
  // addCommands() {
  //   return {
  //     setCodeBlock:
  //       (attributes) =>
  //       ({ commands }) => {
  //         return commands.setNode(this.name, attributes);
  //       },
  //     toggleCodeBlock:
  //       (attributes) =>
  //       ({ commands }) => {
  //         return commands.toggleNode(this.name, "paragraph", attributes);
  //       },
  //   };
  // },

  addKeyboardShortcuts() {
    return {
      // "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),

      Tab: ({ editor }) => {
        if (!isInCodeBlock(editor, this.type)) {
          return false;
        }

        return editor
          .chain()
          .insertContent({ type: "text", text: "  " })
          .command(() => {
            return true;
          })
          .exitCode()
          .run();
      },
      Delete: ({ editor }) => {
        if (!isInCodeBlock(editor, this.type)) {
          return false;
        }

        const { empty, $anchor } = this.editor.state.selection;
        const blockInfo = getBlockInfoFromPos(
          editor.state.doc,
          editor.state.selection.from
        );

        const { node, endPos } = blockInfo;
        const start = $anchor.pos;

        return node.content.size > 0 && start === endPos - 1 && empty;
      },
      "Mod-a": ({ editor }) => {
        if (!isInCodeBlock(editor, this.type)) {
          return false;
        }

        const blockInfo = getBlockInfoFromPos(
          editor.state.doc,
          editor.state.selection.from
        );

        const { startPos, endPos } = blockInfo;

        editor.commands.setTextSelection({
          from: startPos + 1,
          to: endPos - 1,
        });
        return true;
      },
      // remove code block when at start of document or code block is empty
      Backspace: ({ editor }) => {
        if (!isInCodeBlock(editor, this.type)) {
          return false;
        }

        const { empty, $anchor } = this.editor.state.selection;
        const blockInfo = getBlockInfoFromPos(
          editor.state.doc,
          editor.state.selection.from
        );

        const { node, startPos } = blockInfo;
        const start = $anchor.pos;

        return node.content.size > 0 && start === startPos + 1 && empty;
      },

      Enter: ({ editor }) => {
        if (!isInCodeBlock(editor, this.type)) {
          return false;
        }

        const { contentType } = getBlockInfoFromPos(
          editor.state.doc,
          editor.state.selection.from
        )!;

        const selectionEmpty =
          editor.state.selection.anchor === editor.state.selection.head;

        if (contentType !== this.type || !selectionEmpty) {
          return false;
        }

        return editor
          .chain()
          .insertContent({ type: "text", text: "\n" })
          .command(() => {
            return true;
          })
          .exitCode()
          .run();
        //
        // const { state } = editor;
        // const { selection } = state;
        // const { $from, empty } = selection;
        //
        // if (!empty || $from.parent.type !== this.type) {
        //   return false;
        // }
        //
        // const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
        // const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");
        // if (!isAtEnd || !endsWithDoubleNewline) {
        //   return false;
        // }
        //
        // return editor
        //   .chain()
        //   .command(({ tr }) => {
        //     tr.delete($from.pos - 2, $from.pos);
        //
        //     return true;
        //   })
        //   .exitCode()
        //   .run();
      },

      // exit node on arrow keys
      ArrowDown: ({ editor }) => {
        return handleArrowKeysPress(editor, this.type, "down");
      },
      ArrowUp: ({ editor }) => {
        return handleArrowKeysPress(editor, this.type, "up");
      },
      ArrowLeft: ({ editor }) => {
        return handleArrowKeysPress(editor, this.type, "left");
      },
      ArrowRight: ({ editor }) => {
        return handleArrowKeysPress(editor, this.type, "right");
      },
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes, view, getPos }) => {
      const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
        this.name,
        "div",
        {
          ...(this.options.domAttributes?.blockContent || {}),
          ...HTMLAttributes,
        },
        {
          ...(this.options.domAttributes?.inlineContent || {}),
          class: "code-content",
        }
      );

      const codeDOM = document.createElement("div");
      contentDOM.appendChild(codeDOM);

      if (node.attrs.showSelector || node.attrs.lockSelector) {
        const languageWarp = document.createElement("div");
        languageWarp.className = "code-language";
        languageWarp.setAttribute("contentEditable", "false");
        const spanElement = document.createElement("span");
        spanElement.innerText = node.attrs.language;

        languageWarp.appendChild(spanElement);
        languageWarp.appendChild(getArrowDownIcon());

        languageWarp.addEventListener("click", () => {
          if (node.attrs.lockSelector) {
            return;
          }

          const pos = getPos();
          if (typeof pos === "number") {
            view.dispatch(
              view.state.tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                showSelector: true,
                lockSelector: true,
              })
            );
          }
        });
        contentDOM.insertBefore(languageWarp, codeDOM);
      }

      const elementMouseEnterHandler = () => {
        if (node.attrs.lockSelector) {
          return;
        }

        const pos = getPos();
        if (typeof pos === "number") {
          view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, {
              ...node.attrs,
              showSelector: true,
            })
          );
        }
      };

      const elementMouseLeaveHandler = () => {
        if (node.attrs.lockSelector) {
          return;
        }

        const pos = getPos();
        if (typeof pos === "number") {
          view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, {
              ...node.attrs,
              showSelector: false,
            })
          );
        }
      };

      contentDOM.addEventListener("mouseenter", elementMouseEnterHandler);
      contentDOM.addEventListener("mouseleave", elementMouseLeaveHandler);

      return {
        dom,
        contentDOM: codeDOM,
        destroy: () => {
          contentDOM.removeEventListener(
            "mouseenter",
            elementMouseEnterHandler
          );
          contentDOM.removeEventListener(
            "mouseleave",
            elementMouseLeaveHandler
          );
        },
      };
    };
  },

  addProseMirrorPlugins() {
    return [
      shikiLazyPlugin,
      // this plugin creates a code block for pasted content from VS Code
      // we can also detect the copied code language
      // TODO: Move Plugin in CopyExtension
      new Plugin({
        key: new PluginKey("codeBlockVSCodeHandler"),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) {
              return false;
            }

            // don’t create a new code block within code blocks
            if (this.editor.isActive(this.type.name)) {
              return false;
            }

            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if (!text || !language) {
              return false;
            }

            const { tr, schema } = view.state;

            // prepare a text node
            // strip carriage return chars from text pasted as code
            // see: https://github.com/ProseMirror/prosemirror-view/commit/a50a6bcceb4ce52ac8fcc6162488d8875613aacd
            const textNode = schema.text(text.replace(/\r\n?/g, "\n"));

            // create a code block with the text node
            // replace selection with the code block
            tr.replaceSelectionWith(this.type.create({ language }, textNode));

            if (tr.selection.$from.parent.type !== this.type) {
              // put cursor inside the newly created code block
              tr.setSelection(
                TextSelection.near(
                  tr.doc.resolve(Math.max(0, tr.selection.from - 2))
                )
              );
            }

            // store meta information
            // this is useful for other plugins that depends on the paste event
            // like the paste rule plugin
            tr.setMeta("paste", true);

            view.dispatch(tr);

            return true;
          },
        },
      }),
    ];
  },
});

export const CodeBlock = createBlockSpecFromStronglyTypedTiptapNode(
  CodeBlockContent,
  CodeBlockPropSchema
);
