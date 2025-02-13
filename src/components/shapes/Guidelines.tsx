import React from "react";
import { Line } from "react-konva";
import { EditorObjectBase } from "../../types/editor";

interface GuidelinesProps {
  draggedObject: EditorObjectBase | null;
  objects: EditorObjectBase[];
  snapThreshold: number;
}

export const Guidelines: React.FC<GuidelinesProps> = ({
  draggedObject,
  objects,
  snapThreshold = 5,
}) => {
  if (!draggedObject) return null;

  const guidelines: Array<{
    points: number[];
    key: string;
    isSnapping: boolean;
  }> = [];

  // Get center points of dragged object
  const draggedCenterX =
    draggedObject.position.x + draggedObject.size.width / 2;
  const draggedCenterY =
    draggedObject.position.y + draggedObject.size.height / 2;

  // Find other objects to snap to
  objects.forEach((obj) => {
    if (obj.id === draggedObject.id || !obj.visible || obj.type === "root")
      return;

    // Get center points of target object
    const targetCenterX = obj.position.x + obj.size.width / 2;
    const targetCenterY = obj.position.y + obj.size.height / 2;

    // Show guidelines when within show threshold
    if (Math.abs(draggedCenterX - targetCenterX) < snapThreshold) {
      guidelines.push({
        points: [targetCenterX, 0, targetCenterX, window.innerHeight],
        key: `v-${obj.id}`,
        isSnapping: Math.abs(draggedCenterX - targetCenterX) < 1, // Show different style when actually snapped
      });
    }

    // Horizontal center alignment
    if (Math.abs(draggedCenterY - targetCenterY) < snapThreshold) {
      guidelines.push({
        points: [0, targetCenterY, window.innerWidth, targetCenterY],
        key: `h-${obj.id}`,
        isSnapping: Math.abs(draggedCenterY - targetCenterY) < 1,
      });
    }
  });

  return (
    <>
      {guidelines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={line.isSnapping ? "#ff0000" : "#000000"}
          strokeWidth={line.isSnapping ? 2 : 1}
          dash={[4, 4]}
        />
      ))}
    </>
  );
};
