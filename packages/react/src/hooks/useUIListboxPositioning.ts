import {
  useDismiss,
  useFloating,
  UseFloatingOptions,
  useInteractions,
  useListNavigation,
  useTransitionStyles,
  useClick,
  useRole,
} from "@floating-ui/react";
import { useEffect, useMemo, useState, useRef } from "react";

export function useUIListBoxPositioning(
  show: boolean,
  referencePos: DOMRect | null,
  zIndex: number,
  selectedIndex: number | null,
  options?: Partial<UseFloatingOptions>
) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, update, context, floatingStyles } = useFloating({
    open: show,
    ...options,
  });

  const elementsRef = useRef<Array<HTMLElement | null>>([]);

  const { isMounted, styles } = useTransitionStyles(context);

  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    selectedIndex,
    loop: true,
    focusItemOnOpen: false,
    onNavigate: (index) => {
      setActiveIndex(index);
    },
  });

  const click = useClick(context);
  const role = useRole(context, { role: "listbox" });

  // handle "escape" and other dismiss events, these will add some listeners to
  // getFloatingProps which need to be attached to the floating element
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [listNav, click, dismiss, role]
  );

  useEffect(() => {
    update();
  }, [referencePos, update]);

  useEffect(() => {
    // Will be null on initial render when used in UI component controllers.
    if (referencePos === null) {
      return;
    }

    refs.setReference({
      getBoundingClientRect: () => referencePos,
    });
  }, [referencePos, refs]);

  return useMemo(
    () => ({
      isMounted,
      ref: refs.setFloating,
      style: {
        display: "flex",
        outline: "none",
        ...styles,
        ...floatingStyles,
        zIndex: zIndex,
      },
      getFloatingProps,
      getItemProps,
      getReferenceProps,
      context,
      elementsRef,
      activeIndex,
    }),
    [
      isMounted,
      refs.setFloating,
      styles,
      floatingStyles,
      zIndex,
      getFloatingProps,
      getItemProps,
      getReferenceProps,
      context,
      activeIndex,
    ]
  );
}
