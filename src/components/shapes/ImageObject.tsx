import React, { useCallback, useEffect, useRef } from "react";
import { Image, Transformer } from "react-konva";
import type Konva from "konva";
import { ImageObject } from "../../types/editor";
import useImage from "use-image";
import "./ImageObject.scss";
import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";

interface ImageObjectProps {
  object: ImageObject;
  isSelected: boolean;
  onSelect: (
    e:
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
  ) => void;
  onChange: (changes: Partial<ImageObject>) => void;
  onDragStart?: (
    e: Konva.KonvaEventObject<DragEvent>,
    object: ImageObject
  ) => void;
  onDragEnd?: (
    e: Konva.KonvaEventObject<DragEvent>,
    object: ImageObject
  ) => void;
  onDragMove?: (
    e: Konva.KonvaEventObject<DragEvent>,
    object: ImageObject
  ) => void;
  onContextMenu?: (e: KonvaEventObject<MouseEvent>) => void;
  isDraggable: boolean;
}

export const ImageObjectComponent: React.FC<ImageObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onDragMove,
  onContextMenu,
  isDraggable,
}) => {
  const [image] = useImage(object.src);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Update transformer on selection change
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const objectRef = useRef<ImageObject>(object);

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragStart?.(e, object);
      objectRef.current = { ...object };
    },
    [onDragStart, object]
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      //update the position of the object
      objectRef.current.position.x = e.target.x();
      objectRef.current.position.y = e.target.y();

      onDragMove?.(e, { ...objectRef.current });
    },
    [onDragMove]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        position: {
          x: e.target.x(),
          y: e.target.y(),
        },
      });
      onDragEnd?.(e, objectRef.current);
    },
    [onChange, onDragEnd]
  );

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    if (!shapeRef.current) return;
    const node = shapeRef.current;
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
        width: node.width() * scaleX,
        height: node.height() * scaleY,
      },
      rotation: node.rotation(),
    });
  }, [onChange]);

  return (
    <>
      <Image
        ref={shapeRef}
        image={image}
        x={object.position.x}
        y={object.position.y}
        width={object.size.width}
        height={object.size.height}
        rotation={object.rotation}
        opacity={object.opacity}
        draggable={isDraggable}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        globalCompositeOperation={
          object.blendMode as Konva.globalCompositeOperationType
        }
        cornerRadius={object.borderRadius || 0}
        stroke={object.borderColor}
        strokeWidth={object.borderWidth || 0}
        onContextMenu={(e) => {
          e.cancelBubble = true;
          onContextMenu?.(e);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            const minSize = 5;
            const maxSize = 1000;
            if (
              newBox.width < minSize ||
              newBox.height < minSize ||
              newBox.width > maxSize ||
              newBox.height > maxSize
            ) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
