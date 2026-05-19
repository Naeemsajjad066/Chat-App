import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to the scroll sentinel element.
 * Scrolls into view whenever `deps` change.
 */
export function useScrollToBottom(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}
