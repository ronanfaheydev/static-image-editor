import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ResizeHandle.scss";

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  side: "left" | "right";
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  side,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);

  const delta = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.pageX;

      const handleMouseMove = (e: MouseEvent) => {
        const d = e.pageX - startX;
        setIsResizing(true);
        setStartX(e.pageX);
        delta.current = side === "left" ? -d : d;
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
        setIsResizing(false);
        onResize(delta.current);
        delta.current = 0;
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    },
    [onResize, side]
  );

  return (
    <>
      {isResizing && (
        <div
          className="resize-handle-overlay"
          style={{
            [side]: `${-delta.current}px`,
          }}
        />
      )}
      <div
        className={`resize-handle ${side}`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
    </>
  );
};
