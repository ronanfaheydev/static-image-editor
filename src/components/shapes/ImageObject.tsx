import React, { useEffect } from "react";
import { Image, Transformer } from "react-konva";
import type Konva from "konva";
import { ImageObject } from "../../types/editor";
import useImage from "use-image";
import "./ImageObject.scss";

interface ImageObjectProps {
  object: ImageObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<ImageObject>) => void;
}

export const ImageObjectComponent: React.FC<ImageObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const [image] = useImage(object.src);
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const imageRef = React.useRef<Konva.Image>(null);

  // Update transformer on selection change
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle drag end
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      position: {
        x: e.target.x(),
        y: e.target.y(),
      },
    });
  };

  // Handle transform end
  const handleTransformEnd = () => {
    if (!imageRef.current) return;
    const node = imageRef.current;
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
  };

  return (
    <>
      <Image
        ref={imageRef}
        image={image}
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
        globalCompositeOperation={
          object.blendMode as Konva.globalCompositeOperationType
        }
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
