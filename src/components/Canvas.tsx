import React, { useMemo, useRef } from "react";
import { Stage, Layer, Rect, Group, Transformer } from "react-konva";
import {
  EditorState,
  EditorObjectBase,
  ImageObject,
  TextObject,
  ShapeObject,
  GroupObject,
} from "../types/editor";
import { ImageObjectComponent } from "./shapes/ImageObject";
import { TextObjectComponent } from "./shapes/TextObject";
import { ShapeObjectComponent } from "./shapes/ShapeObject";
import { KonvaEventObject } from "konva/lib/Node";
import { Format } from "../types/format";
import { useContainerSize } from "../hooks/useContainerSize";
import "./Canvas.scss";
import type Konva from "konva";

interface CanvasProps {
  editorState: EditorState;
  stageRef: React.RefObject<Konva.Stage>;
  objects: EditorObjectBase[];
  stagePosition: { x: number; y: number };
  handleSelect: (id: string | null) => void;
  handleObjectChange: (id: string, changes: Partial<EditorObjectBase>) => void;
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

  const groupedObjects = useMemo(
    () =>
      objects
        .map((obj) => {
          const children = objects.filter((o) => o.parentId === obj.id);
          return { ...obj, children };
        })
        .filter((obj) => obj.children.length > 0),
    [objects]
  );

  // take root type as a rect
  const root = objects.find((obj) => obj.type === "root") as ShapeObject;
  const ungroupedObjects = objects.filter((obj) => obj.parentId === null);

  const renderObject = (obj: EditorObjectBase) => {
    if (!obj.visible) return null;
    if (obj.type === "image") {
      return (
        <ImageObjectComponent
          key={obj.id}
          object={obj as ImageObject}
          isSelected={editorState.selectedIds.includes(obj.id)}
          onSelect={() => handleSelect(obj.id)}
          onChange={(newProps) => handleObjectChange(obj.id, newProps)}
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
          onChange={(newProps) => handleObjectChange(obj.id, newProps)}
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
          onChange={(newProps) => handleObjectChange(obj.id, newProps)}
        />
      );
    }
    return null;
  };

  const objectsToRender = useMemo(() => {
    return [...groupedObjects, ...ungroupedObjects].sort(
      (a, b) => a.zIndex - b.zIndex
    );
  }, [groupedObjects, ungroupedObjects]);

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
            {root && (
              <Rect
                x={root.position.x}
                y={root.position.y}
                width={root.size.width}
                height={root.size.height}
                fill={root.fill}
                opacity={root.opacity}
                stroke={root.stroke}
                strokeWidth={root.strokeWidth}
              />
            )}
            {objectsToRender.map((obj) => {
              if (obj.children.length > 0) {
                return (
                  <Group
                    key={obj.id}
                    x={obj.position.x}
                    y={obj.position.y}
                    width={obj.size.width}
                    height={obj.size.height}
                    fill={obj.fill}
                    opacity={obj.opacity}
                  >
                    {obj.children.map((child) => renderObject(child))}
                  </Group>
                );
              }
              return renderObject(obj);
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
