import React, { useRef, useEffect, useCallback } from "react";
import { Group, Transformer } from "react-konva";
import type Konva from "konva";
import { EditorObjectBase, GroupObject } from "../../types/editor";
import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { useCachedNode } from "@dnd-kit/core/dist/hooks/utilities";

type KonvaMouseTouch =
  | KonvaEventObject<MouseEvent, Node<NodeConfig>>
  | KonvaEventObject<TouchEvent, Node<NodeConfig>>;

interface GroupObjectProps {
  object: GroupObject;
  isSelected: boolean;
  onSelect: (e: KonvaMouseTouch) => void;
  onChange: (changes: Partial<GroupObject>) => void;
  children: React.ReactNode;
  onContextMenu: (e: KonvaMouseTouch) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>, object: GroupObject) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>, object: GroupObject) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>, object: GroupObject) => void;
  onTransformEnd?: () => void;
  renderNode: (object: EditorObjectBase) => React.ReactNode;
}

export const GroupObjectComponent: React.FC<GroupObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onContextMenu,
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
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
    // onDragEnd?.(e, object);
    onChange({
      position: {
        x: e.target.x(),
        y: e.target.y(),
      },
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    // onTransformEnd?.(e, object);
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

  console.log({ isSelected });

  const handleSelect = useCallback(
    (e: KonvaMouseTouch) => {
      e.cancelBubble = true;
      e.evt.preventDefault();
      console.log("handleSelect", e.evt.target);
      onSelect(e);
    },
    [onSelect]
  );

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
        onClick={handleSelect}
        onTap={handleSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onContextMenu={onContextMenu}
        onSelect={(e: KonvaMouseTouch) => onSelect(e)}
        onDragStart={(e) => {
          onDragStart?.(e, object);
        }}
        onDragMove={(e) => {
          onDragMove?.(e, object);
        }}
        stroke={"blue"}
        strokeWidth={1}
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
