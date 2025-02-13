import { Shape, Transformer } from "react-konva";
import type Konva from "konva";
import { ShapeObject } from "../../types/editor";
import { useCallback, useEffect, useRef } from "react";
import { CurveShape } from "./CurveShape";
import "./ShapeObject.scss";

interface ShapeObjectProps {
  object: ShapeObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newProps: Partial<ShapeObject>) => void;
  onDragStart?: (
    e: Konva.KonvaEventObject<DragEvent>,
    object: ShapeObject
  ) => void;
  onDragEnd?: (
    e: Konva.KonvaEventObject<DragEvent>,
    object: ShapeObject
  ) => void;
}

// Define BoundBox interface
interface BoundBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const ShapeObjectComponent = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
}: ShapeObjectProps) => {
  const shapeRef = useRef<Konva.Shape>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const getShapePath = () => {
    if (object.shapeType === "curve") {
      return null;
    }

    const width = object.size.width;
    const height = object.size.height;

    switch (object.shapeType) {
      case "rectangle":
        return {
          sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            context.fillStrokeShape(shape);
          },
        };
      case "circle":
        return {
          sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
            context.beginPath();
            context.ellipse(
              width / 2,
              height / 2,
              width / 2,
              height / 2,
              0,
              0,
              Math.PI * 2
            );
            context.closePath();
            context.fillStrokeShape(shape);
          },
        };
      case "star":
        return {
          sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
            const outerRadius = Math.min(width, height) / 2;
            const innerRadius = outerRadius / 2;
            const numPoints = 5;
            const centerX = width / 2;
            const centerY = height / 2;

            context.beginPath();
            context.moveTo(centerX + outerRadius, centerY);

            for (let i = 0; i < numPoints * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (i * Math.PI) / numPoints;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              context.lineTo(x, y);
            }

            context.closePath();
            context.fillStrokeShape(shape);
          },
        };
      case "line":
        return {
          sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
            context.beginPath();
            context.moveTo(0, height / 2);
            context.lineTo(width, height / 2);
            context.closePath();
            context.fillStrokeShape(shape);
          },
        };
      default:
        return {};
    }
  };

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragStart?.(e, object);
    },
    [onDragStart, object]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd?.(e, object);
    },
    [onDragEnd, object]
  );

  return (
    <>
      {object.shapeType === "curve" ? (
        <CurveShape
          object={object}
          isSelected={isSelected}
          onSelect={onSelect}
          onChange={onChange}
        />
      ) : (
        <Shape
          {...getShapePath()}
          ref={shapeRef}
          x={object.position.x}
          y={object.position.y}
          width={object.size.width}
          height={object.size.height}
          fill={object.fill}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          rotation={object.rotation}
          opacity={object.opacity}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          blendMode={object.blendMode}
          globalCompositeOperation={object.blendMode}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onTransformEnd={() => {
            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

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
          }}
        />
      )}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox: BoundBox, newBox: BoundBox) => {
            const minWidth = 5;
            const minHeight = 5;
            if (newBox.width < minWidth || newBox.height < minHeight) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
