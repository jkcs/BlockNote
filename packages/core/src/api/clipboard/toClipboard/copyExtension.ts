import { Extension } from "@tiptap/core";
import { Fragment, Node } from "prosemirror-model";
import { NodeSelection, Plugin } from "prosemirror-state";
import { CellSelection } from "prosemirror-tables";
import * as pmView from "prosemirror-view";

import { EditorView } from "prosemirror-view";
import type { BlockNoteEditor } from "../../../editor/BlockNoteEditor";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema";
import { initializeESMDependencies } from "../../../util/esmDependencies";
import { createExternalHTMLExporter } from "../../exporters/html/externalHTMLExporter";
import { cleanHTMLToMarkdown } from "../../exporters/markdown/markdownExporter";

function findChildNodesOfType(
  fragment: Fragment,
  nodeTypeName: string
): Node[] {
  const nodes: Node[] = [];

  fragment.forEach((node) => {
    if (node.type.name === nodeTypeName) {
      nodes.push(node);
    }

    if (node.content.size > 0) {
      nodes.push(...findChildNodesOfType(node.content, nodeTypeName));
    }
  });

  return nodes;
}

export async function selectedFragmentToHTML<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  view: EditorView,
  editor: BlockNoteEditor<BSchema, I, S>
): Promise<{
  clipboardHTML: string;
  externalHTML: string;
  markdown: string;
  text: string;
}> {
  // Checks if a `blockContent` node is being copied and expands
  // the selection to the parent `blockContainer` node. This is
  // for the use-case in which only a block without content is
  // selected, e.g. an image block.
  if (
    "node" in view.state.selection &&
    (view.state.selection.node as Node).type.spec.group === "blockContent"
  ) {
    editor.dispatch(
      editor._tiptapEditor.state.tr.setSelection(
        new NodeSelection(view.state.doc.resolve(view.state.selection.from - 1))
      )
    );
  }

  // Uses default ProseMirror clipboard serialization.
  const clipboardHTML: string = (pmView as any).__serializeForClipboard(
    view,
    view.state.selection.content()
  ).dom.innerHTML;

  let selectedFragment = view.state.selection.content().content;

  // Checks whether block ancestry should be included when creating external
  // HTML. If the selection is within a block content node, the block ancestry
  // is excluded as we only care about the inline content.
  let isWithinBlockContent = false;
  let isWithinCodeBlock = false;
  const isWithinTable = view.state.selection instanceof CellSelection;
  if (!isWithinTable) {
    const fragmentWithoutParents = view.state.doc.slice(
      view.state.selection.from,
      view.state.selection.to,
      false
    ).content;

    const codeBlocks = findChildNodesOfType(selectedFragment, "codeBlock");

    const children = [];
    for (let i = 0; i < fragmentWithoutParents.childCount; i++) {
      children.push(fragmentWithoutParents.child(i));
    }

    isWithinBlockContent =
      children.find(
        (child) =>
          child.type.name === "blockContainer" ||
          child.type.name === "blockGroup" ||
          child.type.spec.group === "blockContent"
      ) === undefined;
    if (isWithinBlockContent) {
      selectedFragment = fragmentWithoutParents;
    }

    if (codeBlocks.length) {
      isWithinCodeBlock = true;
      selectedFragment = Fragment.from(codeBlocks);
    }
  }

  await initializeESMDependencies();
  const externalHTMLExporter = createExternalHTMLExporter(
    view.state.schema,
    editor
  );
  const externalHTML = externalHTMLExporter.exportProseMirrorFragment(
    selectedFragment,
    {
      simplifyBlocks:
        !isWithinCodeBlock && !isWithinBlockContent && !isWithinTable,
    }
  );

  const markdown = cleanHTMLToMarkdown(externalHTML);

  const slice = view.state.selection.content();
  const text = slice.content.textBetween(0, slice.content.size, "\n");

  return { clipboardHTML, externalHTML, markdown, text };
}

const copyToClipboard = <
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  editor: BlockNoteEditor<BSchema, I, S>,
  view: EditorView,
  event: ClipboardEvent
) => {
  // Stops the default browser copy behaviour.
  event.preventDefault();
  event.clipboardData!.clearData();

  (async () => {
    const { clipboardHTML, externalHTML, markdown, text } =
      await selectedFragmentToHTML(view, editor);

    // TODO: Writing to other MIME types not working in Safari for
    //  some reason.
    event.clipboardData!.setData("blocknote/html", clipboardHTML);
    event.clipboardData!.setData("text/html", externalHTML);
    event.clipboardData!.setData("text/markdown", markdown);
    event.clipboardData!.setData("text/plain", text);
  })();
};

export const createCopyToClipboardExtension = <
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  editor: BlockNoteEditor<BSchema, I, S>
) =>
  Extension.create<{ editor: BlockNoteEditor<BSchema, I, S> }, undefined>({
    name: "copyToClipboard",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleDOMEvents: {
              copy(view, event) {
                copyToClipboard(editor, view, event);
                // Prevent default PM handler to be called
                return true;
              },
              cut(view, event) {
                copyToClipboard(editor, view, event);
                view.dispatch(view.state.tr.deleteSelection());
                // Prevent default PM handler to be called
                return true;
              },
              // This is for the use-case in which only a block without content
              // is selected, e.g. an image block, and dragged (not using the
              // drag handle).
              dragstart(view, event) {
                // Checks if a `NodeSelection` is active.
                if (!("node" in view.state.selection)) {
                  return;
                }

                // Checks if a `blockContent` node is being dragged.
                if (
                  (view.state.selection.node as Node).type.spec.group !==
                  "blockContent"
                ) {
                  return;
                }

                // Expands the selection to the parent `blockContainer` node.
                editor.dispatch(
                  editor._tiptapEditor.state.tr.setSelection(
                    new NodeSelection(
                      view.state.doc.resolve(view.state.selection.from - 1)
                    )
                  )
                );

                // Stops the default browser drag start behaviour.
                event.preventDefault();
                event.dataTransfer!.clearData();

                (async () => {
                  const { clipboardHTML, externalHTML, markdown, text } =
                    await selectedFragmentToHTML(view, editor);

                  // TODO: Writing to other MIME types not working in Safari for
                  //  some reason.
                  event.dataTransfer!.setData("blocknote/html", clipboardHTML);
                  event.dataTransfer!.setData("text/html", externalHTML);
                  event.dataTransfer!.setData("text/markdown", markdown);
                  event.dataTransfer!.setData("text/plain", text);
                })();
                // Prevent default PM handler to be called
                return true;
              },
            },
          },
        }),
      ];
    },
  });
