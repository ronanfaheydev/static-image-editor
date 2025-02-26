import { useCallback, useState } from "react";
import { Format } from "../types/format";
import { ContainerSize } from "./useContainerSize";

const INITIAL_PADDING = 50; // 50px on each side

export const useEditorLayout = ({
  containerSize,
}: {
  containerSize: ContainerSize;
  currentFormat: Format;
}) => {
  // Add this function to calculate the zoom level
  const calculateFitZoom = useCallback(
    (format: Format) => {
      if (!containerSize) return 0.8; // default zoom

      const horizontalZoom =
        (containerSize.width - INITIAL_PADDING) / format.width;
      const verticalZoom =
        (containerSize.height - INITIAL_PADDING) / format.height;

      return Math.min(horizontalZoom, verticalZoom, 2); // cap at 2x zoom
    },
    [containerSize]
  );

  // Add state for panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(250);

  const handleLeftPanelResize = useCallback((delta: number) => {
    setLeftPanelWidth((prev) => Math.min(Math.max(prev + delta, 200), 500));
  }, []);

  const handleRightPanelResize = useCallback((delta: number) => {
    setRightPanelWidth((prev) => Math.min(Math.max(prev + delta, 200), 500));
  }, []);

  return {
    calculateFitZoom,
    leftPanelWidth,
    rightPanelWidth,
    handleLeftPanelResize,
    handleRightPanelResize,
  };
};
