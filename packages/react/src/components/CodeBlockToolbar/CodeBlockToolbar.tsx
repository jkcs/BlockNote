import { ReactNode, useMemo } from "react";

import { CodeBlockToolbarProps } from "./CodeBlockToolbarProps";
import { useComponentsContext } from "../../editor/ComponentsContext";

export const CodeBlockToolbar = (
  props: CodeBlockToolbarProps & { children?: ReactNode }
) => {
  const Components = useComponentsContext()!;

  const { onItemClick, items } = props;

  const renderedItems = useMemo<JSX.Element[]>(() => {
    const renderedItems = [];

    for (let i = 0; i < items.length; i++) {
      const language = items[i];
      renderedItems.push(
        <div key={language} onClick={() => onItemClick?.(language)}>
          {language}
        </div>
      );
    }

    return renderedItems;
  }, [onItemClick, items]);

  return (
    <Components.SuggestionMenu.Root
      id="bn-suggestion-menu"
      className="bn-suggestion-menu">
      {renderedItems}
    </Components.SuggestionMenu.Root>
  );
};
