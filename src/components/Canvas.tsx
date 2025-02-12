import React, { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import {
  EditorState,
  EditorObject,
  ImageObject,
  TextObject,
  ShapeObject,
} from "../types/editor";
import { ImageObjectComponent } from "./ImageObject";
import { TextObjectComponent } from "./TextObject";
import { ShapeObjectComponent } from "./ShapeObject";
import { KonvaEventObject } from "konva/lib/Node";
import { Format } from "../types/format";
import { useContainerSize } from "../hooks/useContainerSize";

interface CanvasProps {
  editorState: EditorState;
  stageRef: React.RefObject<Konva.Stage>;
  objects: EditorObject[];
  stagePosition: { x: number; y: number };
  currentFormat: Format;
  handleSelect: (id: string | null) => void;
  handleObjectChange: (id: string, changes: Partial<EditorObject>) => void;
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
  handleDragStart: (e: KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  handleDragMove: (e: KonvaEventObject<DragEvent>) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  editorState,
  stageRef,
  objects,
  stagePosition,
  currentFormat,
  handleSelect,
  handleObjectChange,
  handleWheel,
  handleDragStart,
  handleDragEnd,
  handleDragMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } =
    useContainerSize(containerRef);

  // Handle clicking on stage background or format rect
  const handleBackgroundClick = (e: KonvaEventObject<MouseEvent>) => {
    // Only deselect if clicking the stage or format background rect
    const clickedTarget = e.target;
    const isBackground = clickedTarget === clickedTarget.getStage();
    const isFormatRect = clickedTarget.attrs?.name === "format-background";

    if (isBackground || isFormatRect) {
      e.cancelBubble = true;
      handleSelect(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={
        {
          "--zoom": editorState.zoom,
          backgroundSize: `${20 * editorState.zoom}px ${
            20 * editorState.zoom
          }px`,
        } as React.CSSProperties
      }
    >
      <div className="canvas-wrapper">
        <Stage
          ref={stageRef}
          width={CANVAS_WIDTH || 1600}
          height={CANVAS_HEIGHT || 1200}
          scaleX={editorState.zoom}
          scaleY={editorState.zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable={
            editorState.tool === "select" && !editorState.selectedIds.length
          }
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onClick={handleBackgroundClick}
        >
          <Layer>
            <Rect
              x={(CANVAS_WIDTH - currentFormat.width) / 2}
              y={(CANVAS_HEIGHT - currentFormat.height) / 2}
              width={currentFormat.width}
              height={currentFormat.height}
              fill={editorState.backgroundColor}
              opacity={editorState.backgroundOpacity}
              onClick={handleBackgroundClick}
              name="format-background"
            />
            {objects
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((obj) => {
                if (!obj.visible) return null;
                if (obj.type === "image") {
                  return (
                    <ImageObjectComponent
                      key={obj.id}
                      object={obj as ImageObject}
                      isSelected={editorState.selectedIds.includes(obj.id)}
                      onSelect={() => handleSelect(obj.id)}
                      onChange={(newProps) =>
                        handleObjectChange(obj.id, newProps)
                      }
                    />
                  );
                }
                if (obj.type === "text") {
                  return (
                    <TextObjectComponent
                      key={obj.id}
                      object={obj as TextObject}
                      isSelected={editorState.selectedIds.includes(obj.id)}
                      onSelect={() => handleSelect(obj.id)}
                      onChange={(newProps) =>
                        handleObjectChange(obj.id, newProps)
                      }
                    />
                  );
                }
                if (obj.type === "shape") {
                  return (
                    <ShapeObjectComponent
                      key={obj.id}
                      object={obj as ShapeObject}
                      isSelected={editorState.selectedIds.includes(obj.id)}
                      onSelect={() => handleSelect(obj.id)}
                      onChange={(newProps) =>
                        handleObjectChange(obj.id, newProps)
                      }
                    />
                  );
                }
                return null;
              })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
