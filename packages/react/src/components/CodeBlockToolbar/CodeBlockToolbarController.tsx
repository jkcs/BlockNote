import {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
  CodeBlockLanguageConfig,
} from "@blocknote/core";
import { flip, offset, shift, size } from "@floating-ui/react";
import { FC, useMemo } from "react";

import { useBlockNoteEditor } from "../../hooks/useBlockNoteEditor";
import { useUIPluginState } from "../../hooks/useUIPluginState";
import { CodeBlockToolbar } from "./CodeBlockToolbar";
import { CodeBlockToolbarProps } from "./CodeBlockToolbarProps";
import { useUIListBoxPositioning } from "../../hooks/useUIListboxPositioning";

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

  const selectedIndex = useMemo(() => {
    const index = items.indexOf(state?.language || "");
    if (index === -1) {
      return null;
    }

    return index;
  }, [state]);

  const {
    isMounted,
    ref,
    style,
    getFloatingProps,
    getItemProps,
    context,
    elementsRef,
    activeIndex,
  } = useUIListBoxPositioning(
    state?.show || false,
    state?.referencePos || null,
    4000,
    selectedIndex,
    {
      placement: "bottom-start",
      middleware: [
        offset(0),
        // Flips the menu placement to maximize the space available, and prevents
        // the menu from being cut off by the confines of the screen.
        flip({
          mainAxis: true,
          crossAxis: false,
        }),
        shift(),
        size({
          apply({ availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${availableHeight - 5}px`,
            });
          },
        }),
      ],
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

  const { show, referencePos, language, ...data } = state;

  const Component = props.codeBlockToolbar || CodeBlockToolbar;

  return (
    <div ref={ref} style={style} {...getFloatingProps()}>
      <Component
        {...data}
        {...callbacks}
        floatingContext={context}
        getItemProps={getItemProps}
        elementsRef={elementsRef}
        language={language}
        activeIndex={activeIndex}
        selectedIndex={selectedIndex}
        items={items}
        onItemClick={(item) => {
          editor.codeBlockToolbar.editLanguage(item);
        }}
      />
    </div>
  );
};
