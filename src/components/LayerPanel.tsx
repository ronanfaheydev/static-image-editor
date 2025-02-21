import React, { useState, useCallback, useMemo } from "react";
import { EditorObjectBase, FormatEditMode, LayerObject } from "../types/editor";
import { Format, DEFAULT_FORMATS } from "../types/format";
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
  Modifier,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./LayerPanel.scss";
import {
  findNodeById,
  removeNodeFromParent,
  addNodeToParent,
  updateNodeInTree,
} from "../utils/treeUtils";

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

interface SortableLayerItemProps {
  object: EditorObjectBase;
  isSelected: boolean;
  onSelect: (id: string, multiSelect: boolean) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
  objects: EditorObjectBase[];
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  object,
  isSelected,
  onSelect,
  onVisibilityChange,
  onNameChange,
  onDelete,
  depth = 0,
  objects,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: object.id,
    data: {
      type: object.type,
      parentId: object.parentId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${depth * 20}px`,
    backgroundColor: isOver && object.type === "group" ? "#e6f7ff" : undefined,
    border:
      isOver && object.type === "group" ? "1px dashed #1890ff" : undefined,
    position: "relative" as const,
    zIndex: isDragging ? 999 : undefined,
  };

  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.metaKey || e.ctrlKey);
  };

  return (
    <div
      className={`layer-item ${isSelected ? "selected" : ""}`}
      style={style}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        className="drag-handle"
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </div>

      {/* Group Expand/Collapse Button */}
      {object.type === "group" && (
        <button
          className="toggle-group"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      )}

      {/* Visibility Toggle */}
      <button
        className={`visibility-toggle ${object.visible ? "visible" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onVisibilityChange(object.id, !object.visible);
        }}
      >
        {object.visible ? (
          <span className="visible-icon" />
        ) : (
          <span className="hidden-icon" />
        )}
      </button>

      {/* Layer Name */}
      <input
        className="layer-name"
        value={object.name}
        onChange={(e) => onNameChange(object.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Delete Button */}
      {object.type !== "root" && (
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(object.id);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

interface LayerContainerProps {
  layer: LayerObject | null;
  isRoot?: boolean;
  objects: EditorObjectBase[];
  selectedIds: string[];
  onSelect: (id: string, multiSelect: boolean) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const LayerContainer: React.FC<LayerContainerProps> = ({
  layer,
  isRoot,
  objects,
  selectedIds,
  onSelect,
  onVisibilityChange,
  onNameChange,
  onDelete,
}) => {
  const containerItems = objects.filter((obj) =>
    isRoot
      ? // For root layer, only show direct objects (no layers or groups)
        !obj.parentId &&
        obj.type !== "layer" &&
        obj.type !== "group" &&
        obj.type !== "root"
      : // For other layers, show all direct children
        obj.parentId === layer?.id
  );

  return (
    <div className={`layer-container ${isRoot ? "root-layer" : ""}`}>
      {layer && (
        <SortableLayerItem
          object={layer}
          isSelected={selectedIds.includes(layer.id)}
          onSelect={onSelect}
          onVisibilityChange={onVisibilityChange}
          onNameChange={onNameChange}
          onDelete={onDelete}
          objects={objects}
          depth={0}
        />
      )}
      <SortableContext items={containerItems.map((obj) => obj.id)}>
        <div className="layer-items">
          {containerItems.map((obj) => (
            <SortableLayerItem
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
              onSelect={onSelect}
              onVisibilityChange={onVisibilityChange}
              onNameChange={onNameChange}
              onDelete={onDelete}
              objects={objects}
              depth={1}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

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

  const organizedObjects = useMemo(() => {
    const rootLayer = objects.find((obj) => obj.type === "root");
    const customLayers = objects.filter((obj) => obj.type === "layer");

    // Get objects that belong to each layer
    const layerContents = customLayers.map((layer) => ({
      ...layer,
      children: objects
        .filter((obj) => obj.parentId === layer.id)
        .sort((a, b) => a.zIndex - b.zIndex),
    }));

    // Get root layer objects (no parentId and not layers)
    const rootObjects = objects
      .filter(
        (obj) => !obj.parentId && obj.type !== "layer" && obj.type !== "root"
      )
      .sort((a, b) => a.zIndex - b.zIndex);

    return {
      rootLayer,
      layers: layerContents,
      rootObjects,
    };
  }, [objects]);

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
      setObjects((prev) =>
        prev.map((obj) => {
          if (obj.id === activeObject.id) {
            return { ...obj, parentId: overObject.id };
          }
          return obj;
        })
      );
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
        if (overNode.type === "layer" || overNode.type === "group") {
          return addNodeToParent(
            newTree,
            active.id.toString(),
            over.id.toString()
          );
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

  const renderTreeItem = (node: EditorObjectBase, depth: number = 0) => {
    return (
      <React.Fragment key={node.id}>
        <SortableLayerItem
          object={node}
          isSelected={selectedIds.includes(node.id)}
          onSelect={onSelect}
          onVisibilityChange={onVisibilityChange}
          onNameChange={onNameChange}
          onDelete={onDelete}
          depth={depth}
          objects={objects}
        />
        {node.type === "group" &&
          node.isExpanded &&
          node.children.length > 0 && (
            <div className="children" style={{ marginLeft: 20 }}>
              {node.children.map((child: TreeNode) =>
                renderTreeItem(child, depth + 1)
              )}
            </div>
          )}
      </React.Fragment>
    );
  };

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
                objects={objects}
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
                    objects={objects}
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
                  <div className="dragging-item">
                    {objects.find((obj) => obj.id === activeId)?.name}
                  </div>
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
