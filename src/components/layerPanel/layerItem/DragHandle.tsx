import React from "react";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import "./DragHandle.scss";

interface DragHandleProps {
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  setNodeRef: (element: HTMLElement | null) => void;
}

export const DragHandle: React.FC<DragHandleProps> = ({
  attributes = {},
  listeners = {},
  setNodeRef,
}) => (
  <div className="drag-handle" ref={setNodeRef} {...attributes} {...listeners}>
    ⋮⋮
  </div>
);
