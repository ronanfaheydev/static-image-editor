import React from "react";
import { EditorObject } from "../types/editor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
  objects: EditorObject[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
}

interface SortableLayerItemProps {
  object: EditorObject;
  isSelected: boolean;
  onSelect: () => void;
  onVisibilityChange: (visible: boolean) => void;
  onNameChange: (name: string) => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  object,
  isSelected,
  onSelect,
  onVisibilityChange,
  onNameChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: object.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisibilityChange(!object.visible);
  };

  return (
    <div
      ref={setNodeRef}
      className={`layer-item ${isSelected ? "selected" : ""}`}
      style={style}
      onClick={onSelect}
    >
      <button
        className={`visibility-toggle ${object.visible ? "visible" : ""}`}
        onClick={handleVisibilityClick}
        type="button"
      >
        {object.visible ? "👁" : "👁‍🗨"}
      </button>
      <div className="layer-content">
        <div className="drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </div>
        <input
          value={object.name}
          onChange={(e) => onNameChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          title="Click to edit layer name"
        />
        <span className="layer-type">{object.type}</span>
      </div>
    </div>
  );
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  objects,
  selectedIds,
  onSelect,
  onReorder,
  onVisibilityChange,
  onNameChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Get the sorted array first
    const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);

    // Find indices in the sorted array
    const oldIndex = sortedObjects.findIndex((obj) => obj.id === active.id);
    const newIndex = sortedObjects.findIndex((obj) => obj.id === over.id);

    onReorder(oldIndex, newIndex);
  };

  // Sort objects by zIndex in descending order (highest zIndex at top)
  const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);
  const objectIds = sortedObjects.map((obj) => obj.id);

  return (
    <div className="layer-panel">
      <h3>Layers</h3>
      <div className="layer-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={objectIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedObjects.map((obj) => (
              <SortableLayerItem
                key={obj.id}
                object={obj}
                isSelected={selectedIds.includes(obj.id)}
                onSelect={() => onSelect(obj.id)}
                onVisibilityChange={(visible) =>
                  onVisibilityChange(obj.id, visible)
                }
                onNameChange={(name) => onNameChange(obj.id, name)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="panel-resize-handle" />
    </div>
  );
};
