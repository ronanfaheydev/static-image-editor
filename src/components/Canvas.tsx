import React, { useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Group, Transformer } from "react-konva";
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
} from "../types/editor";
import { ImageObjectComponent } from "./shapes/ImageObject";
import { TextObjectComponent } from "./shapes/TextObject";
import { ShapeObjectComponent } from "./shapes/ShapeObject";
import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { useContainerSize } from "../hooks/useContainerSize";
import "./Canvas.scss";
import type Konva from "konva";
import { Guidelines } from "./shapes/Guidelines";
import { Format } from "../types/format";
import { ContextMenu, ContextMenuItem } from "./common/ContextMenu";
import { ROOT_ID } from "../constants";
import { findNodeById } from "../utils/treeUtils";
import { GroupObjectComponent } from "./shapes/GroupObject";

interface DrawPreviewState {
  type: "text" | "shape" | "image";
  shapeType?: ShapeType;
  position: Position;
  size: Size;
}

interface ContextMenuState {
  show: boolean;
  position: { x: number; y: number };
  objectId: string | null;
  selectedIds?: string[];
}

const DrawPreview: React.FC<{
  drawPreview: DrawPreviewState;
}> = ({ drawPreview }) => {
  return (
    <ShapeObjectComponent
      isDraggable={false}
      object={{
        ...drawPreview,
        fill: "#cccccc",
        stroke: "#000000",
        strokeWidth: 2,
        opacity: 0.6,
        id: "new",
        blendMode: "normal",
        visible: true,
        shapeType: drawPreview.shapeType!,
        type: "shape",
        rotation: 0,
        zIndex: 0,
        parentId: null,
        name: "New Shape",
        children: [],
      }}
      isSelected={false}
      onSelect={() => {}}
      onChange={() => {}}
      onDragStart={() => {}}
      onDragEnd={() => {}}
      onContextMenu={() => {}}
    />
  );
};

interface CanvasProps {
  editorState: EditorState;
  setEditorState: (state: Partial<EditorState>) => void;
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
  isInGroup: (object: EditorObjectBase) => boolean;
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
  isInGroup,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } =
    useContainerSize(containerRef);

  const [draggedObject, setDraggedObject] = useState<EditorObjectBase | null>(
    null
  );

  // Add state for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    position: { x: 0, y: 0 },
    objectId: null,
    selectedIds: [],
  });
  const contextMenuRef = useRef(contextMenu);
  contextMenuRef.current = contextMenu;

  const [drawPreview, setDrawPreview] = useState<DrawPreviewState | null>(null);

  const _handleObjectChange = useCallback(
    (id: string, changes: Partial<EditorObjectBase>) => {
      if (
        changes.position?.x !== undefined &&
        changes.position?.y !== undefined
      ) {
        const originalObject = findNodeById(objects, id) as EditorObjectBase;
        editorState.selectedIds.forEach((selectedId) => {
          if (selectedId === id) return;
          const object = findNodeById(objects, selectedId) as EditorObjectBase;
          if (object) {
            const positionDelta = {
              x: changes.position.x - originalObject.position.x,
              y: changes.position.y - originalObject.position.y,
            };
            const newPosition = {
              x: object.position.x + positionDelta.x,
              y: object.position.y + positionDelta.y,
            };
            handleObjectChange(selectedId, { position: newPosition });
          }
        });
        // const object = objects.find((obj) => obj.id === id);
        // if (object) {
        //   changes.position = snapToObjects(object, changes.position);
        // }
      }
      handleObjectChange(id, { ...changes, position: undefined });
    },
    [handleObjectChange, editorState.selectedIds, objects]
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
    (_: KonvaEventObject<DragEvent>, object: EditorObjectBase) => {
      if (editorState.isDrawing) {
        return;
      }
      handleSelect(object.id, false);
      setDraggedObject(object);
    },
    [handleSelect, editorState.isDrawing]
  );

  const _handleDragObjectEnd = useCallback(() => {
    setDraggedObject(null);
  }, []);

  const _handleDragObjectMove = useCallback(
    (_: KonvaEventObject<DragEvent>, object: EditorObjectBase) => {
      if (editorState.isDrawing) {
        return;
      }
      setDraggedObject(object);
    },
    [editorState.isDrawing]
  );

  const _handleSelect = useCallback(
    (
      node: EditorObjectBase,
      e:
        | KonvaEventObject<MouseEvent, Node<NodeConfig>>
        | KonvaEventObject<TouchEvent, Node<NodeConfig>>
    ) => {
      if (contextMenuRef.current.show) {
        return;
      }
      if (editorState.isDrawing) {
        return;
      }
      e.evt.preventDefault();
      e.cancelBubble = true;
      handleSelect(
        node.id,
        (e.evt as Event & { metaKey?: boolean })?.metaKey ||
          (e.evt as Event & { ctrlKey?: boolean })?.ctrlKey ||
          false
      );
    },
    [handleSelect, editorState.isDrawing]
  );

  const handleContextMenu = useCallback(
    (
      e:
        | KonvaEventObject<MouseEvent, Node<NodeConfig>>
        | KonvaEventObject<TouchEvent, Node<NodeConfig>>,
      objectId?: string
    ) => {
      e.evt.preventDefault();
      // stop bubbling
      e.evt.stopPropagation();
      e.cancelBubble = true;
      const stage = e.target.getStage();
      if (!stage) return;

      const position = {
        x: "clientX" in e.evt ? e.evt.clientX : e.evt.touches[0].clientX,
        y: "clientY" in e.evt ? e.evt.clientY : e.evt.touches[0].clientY,
      };

      setContextMenu({
        show: true,
        position,
        objectId: objectId || null,
        selectedIds: editorState.selectedIds,
      });
    },
    [editorState.selectedIds]
  );

  const renderNode = useCallback(
    (node: EditorObjectBase) => {
      if (!node.visible) return null;

      const _onSelect = _handleSelect.bind(null, node);
      const isDraggable = !editorState.isDrawing && !isInGroup(node);

      switch (node.type) {
        case "group":
          return (
            <GroupObjectComponent
              object={node as GroupObject}
              isSelected={editorState.selectedIds.includes(node.id)}
              onSelect={_onSelect}
              onChange={(newProps) => _handleObjectChange(node.id, newProps)}
              key={node.id}
              renderNode={renderNode}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              isDraggable={isDraggable}
            >
              {node.children.map((child) => renderNode(child))}
            </GroupObjectComponent>
          );

        case "image":
          return (
            <ImageObjectComponent
              key={node.id}
              object={node as ImageObject}
              isSelected={editorState.selectedIds.includes(node.id)}
              onSelect={_onSelect}
              onChange={(newProps) => _handleObjectChange(node.id, newProps)}
              onDragStart={_handleDragObjectStart}
              onDragEnd={_handleDragObjectEnd}
              onDragMove={_handleDragObjectMove}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              isDraggable={isDraggable}
            />
          );

        case "text":
          return (
            <TextObjectComponent
              key={node.id}
              object={node as TextObject}
              isSelected={editorState.selectedIds.includes(node.id)}
              onSelect={_onSelect}
              onChange={(newProps) => _handleObjectChange(node.id, newProps)}
              onDragStart={_handleDragObjectStart}
              onDragEnd={_handleDragObjectEnd}
              onDragMove={handleDragMove}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              isDraggable={isDraggable}
            />
          );

        case "shape":
          return (
            <ShapeObjectComponent
              key={node.id}
              object={node as ShapeObject}
              isSelected={editorState.selectedIds.includes(node.id)}
              onSelect={_onSelect}
              onChange={(newProps) => _handleObjectChange(node.id, newProps)}
              onDragStart={_handleDragObjectStart}
              onDragEnd={_handleDragObjectEnd}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              isDraggable={isDraggable}
            />
          );

        default:
          return null;
      }
    },
    [
      isInGroup,
      editorState.selectedIds,
      editorState.isDrawing,
      _handleSelect,
      _handleObjectChange,
      handleContextMenu,
      _handleDragObjectStart,
      handleDragMove,
      _handleDragObjectEnd,
      _handleDragObjectMove,
    ]
  );

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    const selectedObjects = editorState.selectedIds.map(
      (id) => findNodeById(objects, id) as EditorObjectBase
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

  const handleStageMouseDown = useCallback(() => {
    if (editorState.tool === "select") {
      return;
    }

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

    setEditorState({
      isDrawing: true,
      drawStartPosition: position,
    });

    setDrawPreview({
      type: editorState.tool,
      position,
      size: { width: 0, height: 0 },
      shapeType: editorState.selectedShapeType,
    });
  }, [
    editorState.tool,
    stageRef,
    setEditorState,
    editorState.selectedShapeType,
  ]);

  const handleStageMouseMove = useCallback(() => {
    if (
      !editorState.isDrawing ||
      !editorState.drawStartPosition ||
      !drawPreview
    ) {
      return;
    }

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
      width: currentPosition.x - editorState.drawStartPosition.x,
      height: currentPosition.y - editorState.drawStartPosition.y,
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
  }, [
    editorState.isDrawing,
    editorState.drawStartPosition,
    stageRef,
    drawPreview,
  ]);

  const handleStageMouseUp = useCallback(() => {
    if (
      !editorState.isDrawing ||
      !drawPreview ||
      !editorState.drawStartPosition
    ) {
      return;
    }

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
          fontColor: "#000000",
        } as TextObject);
        break;
    }

    // Reset drawing state
    setEditorState({
      isDrawing: false,
      drawStartPosition: null,
      tool: "select", // Return to select tool after drawing
    });
    setDrawPreview(null);
  }, [editorState, drawPreview, handleAddObject, setEditorState, objects]);

  const rootObject = objects.find(
    (obj) => obj.type === "root"
  ) as EditorObjectBase;

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
              x={rootObject.position.x}
              y={rootObject.position.y}
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
              .map((root) => root.children.map((child) => renderNode(child)))}
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
                <DrawPreview drawPreview={drawPreview} />
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
