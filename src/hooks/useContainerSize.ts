import { useEffect, useState, RefObject } from "react";

export interface ContainerSize {
  width: number;
  height: number;
}

export const useContainerSize = (
  ref: RefObject<HTMLElement | null>
): ContainerSize => {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (!ref.current) return;

      // Get grid layout computed values
      const computedStyle = window.getComputedStyle(ref.current);
      const paddingLeft = parseFloat(computedStyle.paddingLeft);
      const paddingRight = parseFloat(computedStyle.paddingRight);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);

      // Calculate available space
      const width = ref.current.clientWidth - paddingLeft - paddingRight;
      const height = ref.current.clientHeight - paddingTop - paddingBottom;

      setSize({ width, height });
    };

    // Initial size
    updateSize();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateSize);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
};
