import {
  BlockNoteEditor,
  BlockSchema,
  CodeBlockState,
  InlineContentSchema,
  StyleSchema,
  UiElementPosition,
} from "@blocknote/core";

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
    items: string[];
    onItemClick?: (item: string) => void;
  };
