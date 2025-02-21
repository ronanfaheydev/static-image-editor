import { Text, Transformer } from "react-konva";
import type Konva from "konva";
import { TextObject } from "../../types/editor";
import { useCallback, useEffect, useRef } from "react";
import "./TextObject.scss";
import { KonvaEventObject } from "konva/lib/Node";
import { Box } from "konva/lib/types";

interface BoundBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface TextObjectProps {
  object: TextObject;
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<Event>) => void;
  onChange: (newProps: Partial<TextObject>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
}

export const TextObjectComponent = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onDragMove,
}: TextObjectProps) => {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragStart?.(e);
    },
    [onDragStart]
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragMove?.(e);
    },
    [onDragMove]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd?.(e);
      onChange(
        {
          position: {
            x: e.target.x(),
            y: e.target.y(),
          },
        },
        true // isDropping = true
      );
    },
    [onChange, onDragEnd, object]
  );

  return (
    <>
      <Text
        ref={textRef}
        text={object.text}
        x={object.position.x}
        y={object.position.y}
        width={object.size.width}
        height={object.size.height}
        fontSize={object.fontSize}
        fontFamily={object.fontFamily}
        fill={object.fill}
        rotation={object.rotation}
        opacity={object.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={() => {
          // Enable text editing on double click
          const textNode = textRef.current;
          if (!textNode) return;

          const textPosition = textNode.getAbsolutePosition();
          const stageContainer = textNode.getStage()?.container();

          if (!stageContainer) return;

          const textarea = document.createElement("textarea");
          stageContainer.appendChild(textarea);

          textarea.value = object.text;
          textarea.style.position = "absolute";
          textarea.style.top = `${textPosition.y}px`;
          textarea.style.left = `${textPosition.x}px`;
          textarea.style.width = `${textNode.width()}px`;
          textarea.style.height = `${textNode.height()}px`;
          textarea.style.fontSize = `${object.fontSize}px`;
          textarea.style.border = "2px solid #000";
          textarea.style.borderRadius = "5px";
          textarea.style.backgroundColor = "white";
          textarea.style.padding = "0px";
          textarea.style.margin = "0px";
          textarea.style.overflow = "hidden";
          textarea.style.outline = "none";
          textarea.style.resize = "none";
          textarea.style.lineHeight = textNode.lineHeight().toString();
          textarea.style.fontFamily = object.fontFamily;
          textarea.style.transformOrigin = "left top";
          textarea.style.textAlign = textNode.align();
          textarea.style.color = object.fill;

          textarea.focus();

          textarea.addEventListener("blur", function () {
            onChange({ text: textarea.value });
            stageContainer.removeChild(textarea);
          });
        }}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        onTransformEnd={() => {
          const node = textRef.current;
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
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox: Box, newBox: Box) => {
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
