import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CodeBlockToolbarProps } from "./CodeBlockToolbarProps";
import { useComponentsContext } from "../../editor/ComponentsContext";
import { FloatingList, useListItem } from "@floating-ui/react";

const CodeLanguageSelectItem = (props: {
  language: string;
  activeIndex: number | null;
  selectedIndex: number | null;
  onItemClick?: (item: string) => void;
  getItemProps: any;
}) => {
  const { ref, index } = useListItem();

  const { language, activeIndex, selectedIndex, getItemProps, onItemClick } =
    props;
  const isActive = activeIndex === index;
  const isSelected = selectedIndex === index;

  return (
    <div
      ref={ref}
      key={language}
      role="option"
      className={`bn-code-language-item`}
      aria-selected={activeIndex != null ? isActive : isSelected}
      data-language={language}
      tabIndex={isActive ? 0 : -1}
      data-active={isActive ? "" : undefined}
      {...getItemProps({
        onClick: () => {
          onItemClick?.(language);
        },
      })}>
      {language}
    </div>
  );
};

export const CodeBlockToolbar = (
  props: CodeBlockToolbarProps & { children?: ReactNode }
) => {
  const {
    activeIndex,
    selectedIndex,
    onItemClick,
    language,
    items,
    getItemProps,
    elementsRef,
  } = props;

  const textInputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const Components = useComponentsContext()!;

  const renderedItems = useMemo<string[]>(
    () => items.filter((item) => item.indexOf(value) !== -1),
    [items, value]
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.stopPropagation();
      if (activeIndex != null && renderedItems[activeIndex]) {
        onItemClick?.(renderedItems[activeIndex]);
      }
    }
  };

  useEffect(() => {
    if (selectedIndex != null) {
      setTimeout(() => {
        elementsRef.current[selectedIndex]?.scrollIntoView({
          block: "nearest",
        });
        textInputRef.current?.focus();
      });
    }
  }, [selectedIndex, elementsRef, textInputRef]);

  return (
    <Components.SuggestionMenu.Root
      id={"code-block-toolbar"}
      className={"code-block-toolbar"}>
      <div onKeyDown={handleKeyDown}>
        <Components.Generic.Form.TextInput
          // @ts-ignore
          ref={textInputRef}
          name={"code-block-language-input"}
          className={"bn-code-language-input"}
          placeholder={language || "search for a language"}
          value={value}
          icon={null}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            const val = event.target.value;
            setValue(val);
          }}
        />
        <FloatingList elementsRef={elementsRef}>
          {renderedItems.map((language) => {
            return (
              <CodeLanguageSelectItem
                language={language}
                activeIndex={activeIndex}
                selectedIndex={selectedIndex}
                getItemProps={getItemProps}
                key={language}
                onItemClick={onItemClick}
              />
            );
          })}
        </FloatingList>
      </div>
    </Components.SuggestionMenu.Root>
  );
};
