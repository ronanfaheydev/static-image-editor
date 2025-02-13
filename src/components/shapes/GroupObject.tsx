import React, { useRef, useEffect } from "react";
import { Group, Transformer } from "react-konva";
import type Konva from "konva";
import { GroupObject } from "../../types/editor";

interface GroupObjectProps {
  object: GroupObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<GroupObject>) => void;
  children: React.ReactNode;
}

export const GroupObjectComponent: React.FC<GroupObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  children,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      position: {
        x: e.target.x(),
        y: e.target.y(),
      },
    });
  };

  const handleTransformEnd = () => {
    if (!groupRef.current) return;
    const node = groupRef.current;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      },
      rotation: node.rotation(),
    });
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={object.position.x}
        y={object.position.y}
        width={object.size.width}
        height={object.size.height}
        rotation={object.rotation}
        opacity={object.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {children}
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            const minSize = 5;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
