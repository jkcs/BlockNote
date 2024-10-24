import { Editor } from "@tiptap/core/";
import { NodeType } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";

export function getArrowDownIcon() {
  const icon = document.createElement("div");
  icon.style.height = "16px";
  icon.innerHTML =
    '<svg width="1em" height="1em" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;"><path d="M57.297 102.865c3.834-3.834 10.007-3.904 13.927-.21l.215.21 48.99 48.99c3.834 3.834 10.007 3.904 13.927.209l.215-.21 48.99-48.99c3.905-3.904 10.237-3.904 14.142 0 3.834 3.835 3.904 10.008.21 13.928l-.21.215-48.99 48.99c-11.598 11.599-30.331 11.714-42.073.348l-.353-.348-48.99-48.99c-3.905-3.905-3.905-10.237 0-14.142Z" fill="currentColor" fill-rule="nonzero"></path></svg>';
  return icon;
}

export function isInCodeBlock(editor: Editor, nodeType: NodeType): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  return $from.parent.type === nodeType;
}

export function handleArrowKeysPress(
  editor: Editor,
  nodeType: NodeType,
  key: "up" | "down" | "left" | "right"
): boolean {
  if (!isInCodeBlock(editor, nodeType)) {
    return false;
  }

  const keyEnd = key === "down" || key === "right";
  const keyStart = key === "up" || key === "left";

  const { state } = editor;
  const { selection, doc } = state;
  const { $from, empty, $to } = selection;

  const isSelectEnd = $to.pos === $to.end();
  const isSelectStart = $from.pos === $from.start();

  if (!empty && isSelectEnd && keyEnd) {
    return editor.commands.command(({ tr }) => {
      tr.setSelection(Selection.near(doc.resolve($to.pos)));
      return true;
    });
  }

  if (!empty && isSelectStart && keyStart) {
    return editor.commands.command(({ tr }) => {
      tr.setSelection(Selection.near(doc.resolve($from.pos)));
      return true;
    });
  }

  return false;
}
