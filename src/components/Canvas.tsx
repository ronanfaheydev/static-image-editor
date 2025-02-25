import React, { useMemo, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Group, Text, Transformer } from "react-konva";
import {
  EditorState,
  EditorObjectBase,
  ImageObject,
  TextObject,
  ShapeObject,
  GroupObject,
  Position,
  Size,
  ShapeType,
  TreeNode,
} from "../types/editor";
import { ImageObjectComponent } from "./shapes/ImageObject";
import { TextObjectComponent } from "./shapes/TextObject";
import { ShapeObjectComponent } from "./shapes/ShapeObject";
import { KonvaEventObject } from "konva/lib/Node";
import { useContainerSize } from "../hooks/useContainerSize";
import "./Canvas.scss";
import type Konva from "konva";
import { Guidelines } from "./shapes/Guidelines";
import { Format } from "../types/format";
import { ContextMenu, ContextMenuItem } from "./common/ContextMenu";
import { ROOT_ID } from "../constants";

interface CanvasProps {
  editorState: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  stageRef: React.RefObject<Konva.Stage | null>;
  objects: EditorObjectBase[];
  currentFormat: Format;
  stagePosition: { x: number; y: number };
  handleSelect: (id: string | null, multiSelect: boolean) => void;
  handleObjectChange: (id: string, changes: Partial<EditorObjectBase>) => void;
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
  handleDragStart: (e: KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  handleDragMove: (e: KonvaEventObject<DragEvent>) => void;
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleBringToFront: () => void;
  handleSendToBack: () => void;
  handleGroup: () => void;
  handleUngroup: () => void;
  handleBringForward: () => void;
  handleSendBackward: () => void;
  handleAddObject: (object: EditorObjectBase) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  editorState,
  setEditorState,
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
  handleCut,
  handleCopy,
  handlePaste,
  handleBringToFront,
  handleSendToBack,
  handleGroup,
  handleUngroup,
  handleBringForward,
  handleSendBackward,
  handleAddObject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } =
    useContainerSize(containerRef);

  console.log(objects);

  const [draggedObject, setDraggedObject] = useState<EditorObjectBase | null>(
    null
  );

  // Add state for context menu
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    objectId: string | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    objectId: null,
  });

  const [drawPreview, setDrawPreview] = useState<{
    type: "text" | "shape" | "image";
    shapeType?: ShapeType;
    position: Position;
    size: Size;
  } | null>(null);

  const _handleObjectChange = useCallback(
    (id: string, changes: Partial<EditorObjectBase>) => {
      // if (changes.position) {
      //   const object = objects.find((obj) => obj.id === id);
      //   if (object) {
      //     changes.position = snapToObjects(object, changes.position);
      //   }
      // }
      handleObjectChange(id, changes);
    },
    [handleObjectChange]
  );

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        handleSelect(null, false);
      }
    },
    [handleSelect]
  );

  const handleRootClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty = e.target.id() === ROOT_ID;
      if (clickedOnEmpty) {
        handleSelect(null, false);
      }
    },
    [handleSelect]
  );

  const _handleDragObjectStart = useCallback(
    (e: KonvaEventObject<DragEvent>, object: EditorObjectBase) => {
      handleSelect(object.id, false);
      setDraggedObject(object);
    },
    [handleSelect]
  );

  const _handleDragObjectEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    setDraggedObject(null);
  }, []);

  const _handleDragObjectMove = useCallback(
    (e: KonvaEventObject<DragEvent>, object: EditorObjectBase) => {
      setDraggedObject(object);
    },
    []
  );

  const renderNode = (node: EditorObjectBase) => {
    console.log(node);
    if (!node.visible) return null;

    switch (node.type) {
      case "group":
        return (
          <Group
            key={node.id}
            x={(node as GroupObject).position.x}
            y={(node as GroupObject).position.y}
            width={(node as GroupObject).size.width}
            height={(node as GroupObject).size.height}
            rotation={(node as GroupObject).rotation}
            opacity={(node as GroupObject).opacity}
            draggable
            onClick={(e) => {
              e.cancelBubble = true;
              handleSelect(node.id, e.evt.metaKey || e.evt.ctrlKey);
            }}
            onDragStart={(e) => _handleDragObjectStart(e, node as GroupObject)}
            onDragEnd={_handleDragObjectEnd}
            onDragMove={(e) => _handleDragObjectMove(e, node as GroupObject)}
            onTransformEnd={(e: KonvaEventObject<Event>) => {
              const node = e.target;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();

              // Reset scale and update size
              node.scaleX(1);
              node.scaleY(1);

              const newProps: Partial<GroupObject> = {
                position: {
                  x: node.x(),
                  y: node.y(),
                },
                size: {
                  width: node.width() * scaleX,
                  height: node.height() * scaleY,
                },
                rotation: node.rotation(),
              };

              handleObjectChange(node.id(), newProps);

              // Update children positions proportionally
              const children = objects.filter(
                (child) => child.parentId === node.id()
              );
              children.forEach((child) => {
                const relativeX = child.position.x / node.size().width;
                const relativeY = child.position.y / node.size().height;
                handleObjectChange(child.id, {
                  position: {
                    x: newProps.size!.width * relativeX,
                    y: newProps.size!.height * relativeY,
                  },
                  size: {
                    width: child.size.width * scaleX,
                    height: child.size.height * scaleY,
                  },
                });
              });
            }}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          >
            {node.children.map((child: TreeNode) => renderNode(child))}
            {editorState.selectedIds.includes(node.id) && (
              <Transformer
                boundBoxFunc={(oldBox, newBox) => {
                  const minSize = 5;
                  if (newBox.width < minSize || newBox.height < minSize) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Group>
        );

      case "image":
        return (
          <ImageObjectComponent
            key={node.id}
            object={node as ImageObject}
            isSelected={editorState.selectedIds.includes(node.id)}
            onSelect={(e) =>
              handleSelect(node.id, e.evt?.metaKey || e.evt?.ctrlKey)
            }
            onChange={(newProps) => _handleObjectChange(node.id, newProps)}
            onDragStart={_handleDragObjectStart}
            onDragEnd={_handleDragObjectEnd}
            onDragMove={_handleDragObjectMove}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          />
        );

      case "text":
        return (
          <TextObjectComponent
            key={node.id}
            object={node as TextObject}
            isSelected={editorState.selectedIds.includes(node.id)}
            onSelect={(e) =>
              handleSelect(node.id, e.evt?.metaKey || e.evt?.ctrlKey)
            }
            onChange={(newProps) => _handleObjectChange(node.id, newProps)}
            onDragStart={_handleDragObjectStart}
            onDragEnd={_handleDragObjectEnd}
            onDragMove={handleDragMove}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          />
        );

      case "shape":
        return (
          <ShapeObjectComponent
            key={node.id}
            object={node as ShapeObject}
            isSelected={editorState.selectedIds.includes(node.id)}
            onSelect={(
              e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
            ) => handleSelect(node.id, e.evt?.metaKey || e.evt?.ctrlKey)}
            onChange={(newProps) => _handleObjectChange(node.id, newProps)}
            onDragStart={_handleDragObjectStart}
            onDragEnd={_handleDragObjectEnd}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          />
        );

      default:
        return null;
    }
  };

  const handleContextMenu = useCallback(
    (e: KonvaEventObject<MouseEvent>, objectId?: string) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      const position = {
        x: e.evt.clientX,
        y: e.evt.clientY,
      };

      setContextMenu({
        show: true,
        position,
        objectId: objectId || null,
      });
    },
    []
  );

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    const selectedObjects = objects.filter((obj) =>
      editorState.selectedIds.includes(obj.id)
    );

    return [
      {
        label: "Cut",
        action: handleCut,
        shortcut: "⌘X",
        disabled: !selectedObjects.length,
      },
      {
        label: "Copy",
        action: handleCopy,
        shortcut: "⌘C",
        disabled: !selectedObjects.length,
      },
      {
        label: "Paste",
        action: handlePaste,
        shortcut: "⌘V",
        disabled: !localStorage.getItem("clipboard"),
      },
      { label: "", separator: true, action: () => {} },
      {
        label: "Bring to Front",
        action: handleBringToFront,
        shortcut: "⌘]",
        disabled: !selectedObjects.length,
      },
      {
        label: "Bring Forward",
        action: handleBringForward,
        shortcut: "⌘⇧]",
        disabled: !selectedObjects.length,
      },
      {
        label: "Send Backward",
        action: handleSendBackward,
        shortcut: "⌘⇧[",
        disabled: !selectedObjects.length,
      },
      {
        label: "Send to Back",
        action: handleSendToBack,
        shortcut: "⌘[",
        disabled: !selectedObjects.length,
      },
      { label: "", separator: true, action: () => {} },
      {
        label: "Group",
        action: handleGroup,
        shortcut: "⌘G",
        disabled: selectedObjects.length < 2,
      },
      {
        label: "Ungroup",
        action: handleUngroup,
        shortcut: "⌘⇧G",
        disabled: !selectedObjects.some((obj) => obj.type === "group"),
      },
    ];
  }, [
    editorState.selectedIds,
    objects,
    handleCut,
    handleCopy,
    handlePaste,
    handleGroup,
    handleUngroup,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
  ]);

  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (editorState.tool === "select") return;

      // Get position relative to stage
      const stage = stageRef.current;
      if (!stage) return;

      const point = stage.getPointerPosition();
      if (!point) return;

      // Convert to scene coordinates
      const position = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      setEditorState((prev) => ({
        ...prev,
        isDrawing: true,
        drawStartPosition: position,
      }));

      setDrawPreview({
        type: editorState.tool,
        position,
        size: { width: 0, height: 0 },
      });
    },
    [editorState.tool, stageRef, setEditorState]
  );

  const handleStageMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (
        !editorState.isDrawing ||
        !editorState.drawStartPosition ||
        !drawPreview
      )
        return;

      const stage = stageRef.current;
      if (!stage) return;

      const point = stage.getPointerPosition();
      if (!point) return;

      // Convert to scene coordinates
      const currentPosition = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Calculate size based on drag distance
      const size = {
        width: Math.abs(currentPosition.x - editorState.drawStartPosition.x),
        height: Math.abs(currentPosition.y - editorState.drawStartPosition.y),
      };

      // Update preview
      setDrawPreview((prev) =>
        prev
          ? {
              ...prev,
              size,
            }
          : null
      );
    },
    [
      editorState.isDrawing,
      editorState.drawStartPosition,
      stageRef,
      drawPreview,
    ]
  );

  const handleStageMouseUp = useCallback(() => {
    if (
      !editorState.isDrawing ||
      !drawPreview ||
      !editorState.drawStartPosition
    )
      return;

    // Create the new object based on the preview
    const baseObject = {
      position: editorState.drawStartPosition,
      size: drawPreview.size,
      parentId: editorState.selectedLayerId || null,
    };
    const shapeType =
      editorState.selectedShapeType || ("rectangle" as ShapeType);
    switch (editorState.tool) {
      case "shape":
        handleAddObject({
          ...baseObject,
          type: "shape",
          shapeType,
          name: `${shapeType} ${objects.length + 1}`,
          fill: "#cccccc",
          stroke: "#000000",
          strokeWidth: 2,
        } as ShapeObject);
        break;
      case "text":
        handleAddObject({
          ...baseObject,
          type: "text",
          text: "Double click to edit",
          fontSize: 20,
          fontFamily: "Arial",
          fill: "#000000",
        } as TextObject);
        break;
    }

    // Reset drawing state
    setEditorState((prev: EditorState) => ({
      ...prev,
      isDrawing: false,
      drawStartPosition: null,
      tool: "select", // Return to select tool after drawing
    }));
    setDrawPreview(null);
  }, [editorState, drawPreview, handleAddObject, setEditorState, objects]);

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
          cursor: editorState.tool === "select" ? "grab" : "crosshair",
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
            editorState.tool === "select" &&
            !editorState.selectedIds.length &&
            !editorState.isDrawing
          }
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onClick={handleStageClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={currentFormat.width}
              height={currentFormat.height}
              fill={editorState.backgroundColor}
              opacity={editorState.backgroundOpacity}
              onClick={handleRootClick}
              id={ROOT_ID}
            />
            {/* Root objects */}
            {objects
              .filter((obj) => obj.type === "root")
              .map((root) =>
                root.children.map((child) => {
                  console.log(child);
                  return renderNode(child);
                })
              )}
          </Layer>
          {objects
            .filter((obj) => obj.type === "layer")
            .map((layer) => (
              <Layer
                key={layer.id}
                opacity={layer.opacity}
                visible={layer.visible}
              >
                {layer.children.map((child) => renderNode(child))}
              </Layer>
            ))}
          <Layer>
            <Guidelines
              draggedObject={draggedObject}
              objects={objects}
              snapThreshold={50}
            />
          </Layer>
          {/* Preview layer */}
          {drawPreview && (
            <Layer>
              {drawPreview.type === "shape" && (
                <Rect
                  x={drawPreview.position.x}
                  y={drawPreview.position.y}
                  width={drawPreview.size.width}
                  height={drawPreview.size.height}
                  fill="#cccccc"
                  stroke="#000000"
                  strokeWidth={2}
                  opacity={0.6}
                />
              )}
              {drawPreview.type === "text" && (
                <Rect
                  x={drawPreview.position.x}
                  y={drawPreview.position.y}
                  width={drawPreview.size.width}
                  height={drawPreview.size.height}
                  stroke="#000000"
                  strokeWidth={1}
                  dash={[5, 5]}
                  opacity={0.6}
                />
              )}
            </Layer>
          )}
        </Stage>
      </div>
      {contextMenu.show && (
        <ContextMenu
          items={getContextMenuItems()}
          position={contextMenu.position}
          onClose={() => setContextMenu((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};
