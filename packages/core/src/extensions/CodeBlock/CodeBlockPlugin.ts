import { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey, PluginView } from "prosemirror-state";

import type { BlockNoteEditor } from "../../editor/BlockNoteEditor";
import { UiElementPosition } from "../../extensions-shared/UiElementPosition";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../schema";
import { EventEmitter } from "../../util/EventEmitter";
import { getBlockInfoFromPos } from "../../api/getBlockInfoFromPos";

export type CodeBlockState = UiElementPosition & {
  language: string;
};

class CodeBlockToolbarView implements PluginView {
  public state?: CodeBlockState;
  public emitUpdate: () => void;

  blockPos: number | undefined;

  constructor(
    private readonly editor: BlockNoteEditor<any, any, any>,
    private readonly pmView: EditorView,
    emitUpdate: (state: CodeBlockState) => void
  ) {
    this.emitUpdate = () => {
      if (!this.state) {
        throw new Error(
          "Attempting to update uninitialized code block toolbar"
        );
      }

      emitUpdate(this.state);
    };

    this.pmView.root.addEventListener(
      "click",
      this.clickHandler as EventListener,
      true
    );

    this.pmView.root.addEventListener("scroll", this.scrollHandler, true);
  }

  clickHandler = (event: MouseEvent) => {
    if (!this.editor.isEditable) {
      return;
    }
    const editorWrapper = this.pmView.dom.parentElement!;
    const beforeBlockPos = this.blockPos;

    if (
      event &&
      event.target &&
      (editorWrapper === (event.target as Node) ||
        editorWrapper.contains(event.target as Node))
    ) {
      let isinCodeLanguageEle = false;
      let parent = event.target as HTMLElement | null;
      while (parent) {
        if (parent.classList.contains("code-language")) {
          isinCodeLanguageEle = true;
          break;
        }

        parent = parent.parentElement;
      }

      if (isinCodeLanguageEle) {
        this.blockPos = this.pmView.posAtDOM(parent as Node, 0);
        const blockInfo = getBlockInfoFromPos(
          this.pmView.state.doc,
          this.blockPos
        );

        if (!this.state?.show && isinCodeLanguageEle && parent && blockInfo) {
          this.state = {
            show: true,
            referencePos: parent.getBoundingClientRect(),
            language: blockInfo.contentNode.attrs.language,
          };
          this.emitUpdate();
        }
      } else if (beforeBlockPos != null) {
        const blockInfo = getBlockInfoFromPos(
          this.pmView.state.doc,
          beforeBlockPos
        );

        if (blockInfo) {
          const { contentNode, startPos } = blockInfo;

          this.pmView.dispatch(
            this.pmView.state.tr.setNodeMarkup(startPos, null, {
              ...contentNode.attrs,
              lockSelector: false,
            })
          );
        }
      }
    }
  };

  scrollHandler = () => {
    if (this.state?.show && this.blockPos != null) {
      const { id } = getBlockInfoFromPos(this.pmView.state.doc, this.blockPos);
      const codeLanguageElement = this.pmView.root.querySelector(
        `[data-node-type="blockContainer"][data-id="${id}"] .code-language`
      );
      if (!codeLanguageElement) {
        return;
      }

      this.state.referencePos = codeLanguageElement.getBoundingClientRect();
      this.emitUpdate();
    }
  };

  editLanguage(language: string) {
    const { $anchor } = this.pmView.state.selection;
    const node = this.pmView.state.tr.doc.resolve($anchor.pos).node();
    const view = this.pmView;

    const { startPos } = getBlockInfoFromPos(view.state.doc, $anchor.pos);
    this.editor.dispatch(
      view.state.tr.setNodeMarkup(startPos, null, {
        ...node.attrs,
        language,
      })
    );

    if (this.state?.show) {
      this.state.show = false;
      this.emitUpdate();
    }
  }

  closeMenu = () => {
    if (this.state?.show) {
      if (this.blockPos != null) {
        const blockInfo = getBlockInfoFromPos(
          this.pmView.state.doc,
          this.blockPos
        );
        if (blockInfo) {
          const { contentNode, startPos } = blockInfo;

          this.pmView.dispatch(
            this.pmView.state.tr.setNodeMarkup(startPos, null, {
              ...contentNode.attrs,
              showSelector: false,
              lockSelector: false,
            })
          );
        }
      }

      this.state.show = false;
      this.emitUpdate();
    }
  };

  destroy() {
    this.pmView.root.removeEventListener("scroll", this.scrollHandler, true);
    this.pmView.root.removeEventListener(
      "click",
      this.clickHandler as EventListener,
      true
    );
  }
}

export const CodeBlockToolbarPluginKey = new PluginKey(
  "CodeBlockToolbarPluginKey"
);

export class CodeBlockToolbarProsemirrorPlugin<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
> extends EventEmitter<any> {
  private view: CodeBlockToolbarView | undefined;
  public readonly plugin: Plugin;

  constructor(editor: BlockNoteEditor<BSchema, I, S>) {
    super();
    this.plugin = new Plugin({
      key: CodeBlockToolbarPluginKey,
      view: (editorView) => {
        this.view = new CodeBlockToolbarView(editor, editorView, (state) => {
          this.emit("update", state);
        });
        return this.view;
      },
      props: {
        handleKeyDown: (_view, event: KeyboardEvent) => {
          if (event.key === "Escape" && this.shown) {
            this.view!.closeMenu();
            return true;
          }
          return false;
        },
      },
    });
  }

  public onUpdate(callback: (state: CodeBlockState) => void) {
    return this.on("update", callback);
  }

  public editLanguage = (language: string) => {
    this.view!.editLanguage(language);
  };

  public get shown() {
    return this.view?.state?.show || false;
  }

  public closeMenu = () => this.view!.closeMenu();
}