import {
  BlockNoteEditor,
  BlockSchema,
  CodeBlockState,
  InlineContentSchema,
  StyleSchema,
  UiElementPosition,
} from "@blocknote/core";
import {
  FloatingContext,
  UseInteractionsReturn,
} from "@floating-ui/react/dist/floating-ui.react";
import { MutableRefObject } from "react";

export type CodeBlockToolbarProps = Omit<
  CodeBlockState,
  keyof UiElementPosition
> &
  Pick<
    BlockNoteEditor<
      BlockSchema,
      InlineContentSchema,
      StyleSchema
    >["codeBlockToolbar"],
    "editLanguage"
  > & {
    floatingContext: FloatingContext;
    getItemProps: UseInteractionsReturn["getItemProps"];
    elementsRef: MutableRefObject<Array<HTMLElement | null>>;
    language: string;
    activeIndex: number | null;
    selectedIndex: number | null;
    items: string[];
    onItemClick?: (item: string) => void;
  };
