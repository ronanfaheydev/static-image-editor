import React from "react";
import { Line, Circle, Group } from "react-konva";
import { ShapeObject } from "../../types/editor";
import { KonvaEventObject } from "konva/lib/Node";

interface CurveShapeProps {
  object: ShapeObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<ShapeObject>) => void;
}

export const CurveShape: React.FC<CurveShapeProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const defaultPoints = [50, 50, 200, 50, 200, 200];
  const points = object.curveConfig?.points || defaultPoints;
  const tension = object.curveConfig?.tension || 0.5;

  const handleDragMove =
    (index: number) => (e: KonvaEventObject<DragEvent>) => {
      const newPoints = [...points];
      newPoints[index] = e.target.x();
      newPoints[index + 1] = e.target.y();

      onChange({
        curveConfig: {
          ...object.curveConfig,
          points: newPoints,
        },
      });
    };

  return (
    <Group
      x={object.position.x}
      y={object.position.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          position: {
            x: e.target.x(),
            y: e.target.y(),
          },
        });
      }}
    >
      <Line
        points={points}
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        tension={tension}
        closed={object.curveConfig?.closed}
      />
      {isSelected && (
        <>
          {Array.from({ length: points.length / 2 }).map((_, i) => (
            <Circle
              key={i}
              x={points[i * 2]}
              y={points[i * 2 + 1]}
              radius={5}
              fill="white"
              stroke="black"
              draggable
              onDragMove={handleDragMove(i * 2)}
            />
          ))}
        </>
      )}
    </Group>
  );
};
