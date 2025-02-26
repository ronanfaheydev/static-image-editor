import React, { useCallback } from "react";
import { EditorObjectBase } from "../../types/editor";
import "./ResizeOptions.scss";

interface ResizeOptionsProps {
  object: EditorObjectBase;
  canvasSize: { width: number; height: number };
  onResize: (newSize: {
    width: number;
    height: number;
    x: number;
    y: number;
  }) => void;
  onCrop: () => void;
}

export const ResizeOptions: React.FC<ResizeOptionsProps> = ({
  object,
  canvasSize,
  onResize,
  onCrop,
}) => {
  const handleFill = useCallback(() => {
    const scale = Math.max(
      canvasSize.width / object.size.width,
      canvasSize.height / object.size.height
    );
    const newWidth = object.size.width * scale;
    const newHeight = object.size.height * scale;
    const x = (canvasSize.width - newWidth) / 2;
    const y = (canvasSize.height - newHeight) / 2;

    onResize({ width: newWidth, height: newHeight, x, y });
  }, [onResize, object, canvasSize]);

  const handleFit = useCallback(() => {
    const scale = Math.min(
      canvasSize.width / object.size.width,
      canvasSize.height / object.size.height
    );
    const newWidth = object.size.width * scale;
    const newHeight = object.size.height * scale;
    const x = 0;
    const y = 0;

    onResize({ width: newWidth, height: newHeight, x, y });
  }, [onResize, object, canvasSize]);

  return (
    <div className="resize-options">
      <button onClick={handleFill} className="resize-button">
        Fill
      </button>
      <button onClick={handleFit} className="resize-button">
        Fit
      </button>
      <button onClick={onCrop} className="resize-button">
        Crop
      </button>
    </div>
  );
};
