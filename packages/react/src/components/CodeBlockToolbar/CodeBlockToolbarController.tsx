import {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
  CodeBlockLanguageConfig,
} from "@blocknote/core";
import { flip, offset } from "@floating-ui/react";
import { FC } from "react";

import { useBlockNoteEditor } from "../../hooks/useBlockNoteEditor";
import { useUIElementPositioning } from "../../hooks/useUIElementPositioning";
import { useUIPluginState } from "../../hooks/useUIPluginState";
import { CodeBlockToolbar } from "./CodeBlockToolbar";
import { CodeBlockToolbarProps } from "./CodeBlockToolbarProps";

const items = CodeBlockLanguageConfig.bundledLanguages;

export const CodeBlockToolbarController = <
  BSchema extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema
>(props: {
  codeBlockToolbar?: FC<CodeBlockToolbarProps>;
}) => {
  const editor = useBlockNoteEditor<BSchema, I, S>();

  const callbacks = {
    editLanguage: editor.codeBlockToolbar.editLanguage,
  };

  const state = useUIPluginState(
    editor.codeBlockToolbar.onUpdate.bind(editor.codeBlockToolbar)
  );
  const { isMounted, ref, style, getFloatingProps } = useUIElementPositioning(
    state?.show || false,
    state?.referencePos || null,
    4000,
    {
      placement: "top-start",
      middleware: [offset(10), flip()],
      onOpenChange: (open) => {
        if (!open) {
          editor.codeBlockToolbar.closeMenu();
          editor.focus();
        }
      },
    }
  );

  if (!isMounted || !state) {
    return null;
  }

  const { show, referencePos, ...data } = state;

  const Component = props.codeBlockToolbar || CodeBlockToolbar;

  return (
    <div ref={ref} style={style} {...getFloatingProps()}>
      <Component
        {...data}
        {...callbacks}
        items={items}
        onItemClick={(item) => {
          editor.codeBlockToolbar.editLanguage(item);
        }}
      />
    </div>
  );
};
