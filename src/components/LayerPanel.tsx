import React, { useState, useCallback, useMemo } from "react";
import { EditorObjectBase, FormatEditMode } from "../types/editor";
import { Format, DEFAULT_FORMATS } from "../types/format";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./LayerPanel.scss";

interface LayerPanelProps {
  objects: EditorObjectBase[];
  selectedIds: string[];
  onSelect: (id: string) => void;
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
  setObjects: (objects: EditorObjectBase[]) => void;
  onDelete: (id: string) => void;
}

interface SortableLayerItemProps {
  object: EditorObjectBase;
  isSelected: boolean;
  onSelect: (id: string) => void;
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
    position: isDragging ? "relative" : "static",
    zIndex: isDragging ? 999 : undefined,
  };

  const childObjects = object.children;
  const isGroup = object.type === "group";
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <div
        ref={setNodeRef}
        className={`layer-item ${isSelected ? "selected" : ""}`}
        style={style}
        onClick={() => onSelect(object.id)}
      >
        {isGroup && (
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
        <div className="layer-content">
          <div className="drag-handle" {...attributes} {...listeners}>
            ⋮⋮
          </div>
          <input
            value={object.name}
            onChange={(e) => onNameChange(object.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="layer-type">{object.type}</span>
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(object.id);
            }}
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
      {isGroup &&
        isExpanded &&
        childObjects.map((child) => (
          <SortableLayerItem
            key={child.id}
            object={child}
            isSelected={isSelected}
            onSelect={onSelect}
            onVisibilityChange={onVisibilityChange}
            onNameChange={onNameChange}
            onDelete={onDelete}
            depth={depth + 1}
            objects={objects}
          />
        ))}
    </>
  );
};

const restrictToGroupDropModifier: Modifier = ({
  transform,
  draggingNodeRect,
  over,
}) => {
  if (!over?.data.current?.type || over.data.current.type !== "group") {
    return transform;
  }

  // Return null to prevent any movement when over a group
  return {};
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  objects,
  selectedIds,
  onSelect,
  onVisibilityChange,
  onNameChange,
  currentFormat,
  handleFormatChange,
  handleCustomFormatAdd,
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

  const groupedObjects = useMemo(() => {
    return objects
      .filter((obj) => obj.type === "group")
      .map((obj) => {
        const children = objects.filter((o) => o.parentId === obj.id);
        return { ...obj, children };
      });
    // .filter((obj) => obj.children.length > 0);
  }, [objects]);

  const ungroupedObjects = objects.filter(
    (obj) =>
      obj.parentId === null && obj.type !== "root" && obj.type !== "group"
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setObjects((prev) => {
        const overObject = prev.find((obj) => obj.id === over.id);

        // If dragging onto a group
        if (overObject?.type === "group") {
          return prev.map((obj) =>
            obj.id === active.id ? { ...obj, parentId: over.id } : obj
          );
        }
        // Otherwise reorder
        const startIndex = prev.findIndex((obj) => obj.id === active.id);
        const endIndex = prev.findIndex((obj) => obj.id === over.id);

        // Get sorted objects first
        const sortedObjects = [...prev].sort((a, b) => b.zIndex - a.zIndex);

        // Reorder the sorted array
        const [removed] = sortedObjects.splice(startIndex, 1);
        sortedObjects.splice(endIndex, 0, removed);

        // Update zIndices based on new order
        const updatedObjects = sortedObjects.map((obj, index) => ({
          ...obj,
          zIndex: sortedObjects.length - index - 1,
        }));

        return updatedObjects;
      });
    },
    [setObjects]
  );

  console.log(objects);

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
          </div>
          <div className="layer-list">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToGroupDropModifier]}
            >
              <SortableContext
                items={objects.map((obj) => obj.id)}
                strategy={verticalListSortingStrategy}
              >
                {groupedObjects.map((obj) => (
                  <SortableLayerItem
                    key={obj.id}
                    object={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    onSelect={onSelect}
                    onVisibilityChange={onVisibilityChange}
                    onNameChange={onNameChange}
                    onDelete={onDelete}
                    objects={objects}
                    depth={0}
                  />
                ))}
                {ungroupedObjects.map((obj) => (
                  <SortableLayerItem
                    key={obj.id}
                    object={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    onSelect={onSelect}
                    onVisibilityChange={onVisibilityChange}
                    onNameChange={onNameChange}
                    onDelete={onDelete}
                    objects={objects}
                    depth={0}
                  />
                ))}
              </SortableContext>
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
              onChange={(e) => handleFormatEditModeChange(e.target.value)}
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
