import React, { useState, useCallback, useMemo } from "react";
import {
  EditorObjectBase,
  FormatEditMode,
  LayerObject,
  TreeNode,
} from "../../types/editor";
import { Format, DEFAULT_FORMATS } from "../../types/format";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import "./LayerPanel.scss";
import {
  findNodeById,
  removeNodeFromParent,
  addNodeToParent,
  updateNodeInTree,
  insertNode,
} from "../../utils/treeUtils";
import { LayerContainer } from "./layerItem/LayerContainer";
import { SortableLayerItem } from "./layerItem/SortableLayerItem";

interface LayerPanelProps {
  objects: EditorObjectBase[];
  selectedIds: string[];
  onSelect: (id: string, multiSelect: boolean) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  currentFormat: Format;
  handleFormatChange: (format: Format) => void;
  handleCustomFormatAdd: (format: Format) => void;
  handleFormatEditModeChange: (mode: FormatEditMode) => void;
  openDialog: (dialogName: string) => void;
  formatEditMode: FormatEditMode;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onAddGroup: () => void;
  setObjects: React.Dispatch<React.SetStateAction<EditorObjectBase[]>>;
  onDelete: (id: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  objects,
  selectedIds,
  onSelect,
  onVisibilityChange,
  onNameChange,
  currentFormat,
  handleFormatChange,
  handleFormatEditModeChange,
  openDialog,
  formatEditMode,
  zoom,
  onZoomChange,
  onAddGroup,
  setObjects,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"layers" | "format">("layers");
  const formats = [...DEFAULT_FORMATS];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleAddLayer = useCallback(() => {
    const newLayer: LayerObject = {
      id: `layer-${Date.now()}`,
      type: "layer",
      name: "New Layer",
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      rotation: 0,
      opacity: 1,
      visible: true,
      zIndex: objects.length, // Place new layer at top
      blendMode: "normal",
      parentId: null,
      children: [],
      isExpanded: true,
    };

    setObjects((prev) => [...prev, newLayer]);
  }, [setObjects, objects]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeObject = objects.find((obj) => obj.id === active.id);
    const overObject = objects.find((obj) => obj.id === over.id);

    if (!activeObject || !overObject) return;

    // If dragging over a layer, prepare to move into that layer
    if (overObject.type === "layer" && activeObject.type !== "layer") {
      // removeNodeFromParent(objects, activeObject.id);
      setObjects(addNodeToParent(objects, activeObject.id, overObject.id));
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setObjects((prev) => {
        const activeNode = findNodeById(prev, active.id.toString());
        const overNode = findNodeById(prev, over.id.toString());

        if (!activeNode || !overNode) return prev;

        // Remove node from its current parent
        const newTree = removeNodeFromParent(prev, active.id.toString());

        // If dropping onto a layer or group, add as child
        if (
          overNode.type === "layer" ||
          overNode.type === "group" ||
          overNode.type === "root"
        ) {
          return insertNode(newTree, activeNode, overNode.id);
        }

        // If dropping between items, reorder within parent
        const overParent = findNodeById(prev, overNode.parentId || "");
        if (overParent) {
          const parentChildren = [...overParent.children];
          const fromIndex = parentChildren.findIndex(
            (child) => child.id === active.id
          );
          const toIndex = parentChildren.findIndex(
            (child) => child.id === over.id
          );

          parentChildren.splice(fromIndex, 1);
          parentChildren.splice(toIndex, 0, activeNode);

          return updateNodeInTree(newTree, overParent.id, {
            ...overParent,
            children: parentChildren,
          });
        }

        return prev;
      });
    },
    [setObjects]
  );

  return (
    <div className="layer-panel">
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === "layers" ? "active" : ""}`}
          onClick={() => setActiveTab("layers")}
        >
          Layers
        </button>
        <button
          className={`tab ${activeTab === "format" ? "active" : ""}`}
          onClick={() => setActiveTab("format")}
        >
          Format
        </button>
      </div>

      {activeTab === "layers" ? (
        <>
          <div className="layer-actions">
            <button onClick={onAddGroup}>Add Group</button>
            <button className="add-layer-button" onClick={handleAddLayer}>
              Add Layer
            </button>
          </div>
          <div className="layer-list">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {/* Root layer container */}
              <LayerContainer
                layer={
                  objects.find((obj) => obj.type === "root") as LayerObject
                }
                isRoot={true}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onVisibilityChange={onVisibilityChange}
                onNameChange={onNameChange}
                onDelete={onDelete}
              />

              {/* Custom layer containers */}
              {objects
                .filter((obj) => obj.type === "layer")
                .map((layer) => (
                  <LayerContainer
                    key={layer.id}
                    layer={layer as LayerObject}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    onVisibilityChange={onVisibilityChange}
                    onNameChange={onNameChange}
                    onDelete={onDelete}
                  />
                ))}

              {/* Show drag overlay */}
              {activeId && (
                <DragOverlay>
                  <SortableLayerItem
                    object={
                      (objects.find(
                        (obj) => obj.id === activeId
                      ) as EditorObjectBase) || {}
                    }
                    isSelected={selectedIds.includes(activeId)}
                    onSelect={onSelect}
                    onVisibilityChange={onVisibilityChange}
                    onNameChange={onNameChange}
                    onDelete={onDelete}
                  />
                </DragOverlay>
              )}
            </DndContext>
          </div>
        </>
      ) : (
        <div className="format-panel">
          <div className="format-section">
            <h3>Canvas Format</h3>
            <select
              value={currentFormat.id}
              onChange={(e) => {
                const format = formats.find((f) => f.id === e.target.value);
                if (format) handleFormatChange(format);
              }}
            >
              {formats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.name} ({format.width}x{format.height})
                </option>
              ))}
            </select>
            <button onClick={() => openDialog("CustomFormatModal")}>
              Add Custom Format
            </button>
          </div>

          <div className="format-section">
            <h3>Templates</h3>
            <button onClick={() => openDialog("TemplateBrowserModal")}>
              Browse Templates
            </button>
            <button onClick={() => openDialog("SaveTemplateModal")}>
              Save as Template
            </button>
          </div>

          <div className="format-section">
            <h3>Format Edit Mode</h3>
            <select
              value={formatEditMode}
              onChange={(e) =>
                handleFormatEditModeChange(e.target.value as FormatEditMode)
              }
            >
              <option value="single">Single</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      )}
      <div className="zoom-control">
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="panel-resize-handle" />
    </div>
  );
};
