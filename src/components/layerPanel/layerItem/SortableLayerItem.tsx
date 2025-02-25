import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorObjectBase } from "../../../types/editor";
import "./SortableLayerItem.scss";

interface SortableLayerItemProps {
  object: EditorObjectBase;
  isSelected: boolean;
  onSelect: (id: string, multiSelect: boolean) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

export const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  object,
  isSelected,
  onSelect,
  onVisibilityChange,
  onNameChange,
  onDelete,
  depth = 0,
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
