import { Text, Transformer } from "react-konva";
import type Konva from "konva";
import { TextObject } from "../../types/editor";
import { useCallback, useEffect, useRef } from "react";
import "./TextObject.scss";
import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { Box } from "konva/lib/shapes/Transformer";

interface TextObjectProps {
  object: TextObject;
  isSelected: boolean;
  onSelect: (
    e:
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
  ) => void;
  onChange: (newProps: Partial<TextObject>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>, object: TextObject) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>, object: TextObject) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>, object: TextObject) => void;
  onContextMenu?: (
    e:
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
  ) => void;
  isDraggable: boolean;
}

export const TextObjectComponent = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDraggable,
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
      onDragStart?.(e, object);
    },
    [onDragStart, object]
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragMove?.(e, object);
    },
    [onDragMove, object]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd?.(e, object);
      onChange({
        position: {
          x: e.target.x(),
          y: e.target.y(),
        },
      });
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
        fill={object.fontColor}
        stroke={object.stroke}
        rotation={object.rotation}
        opacity={object.opacity}
        draggable={isDraggable}
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
          textarea.style.color = object.fontColor;
          textarea.style.opacity = object.opacity.toString();
          textarea.style.zIndex = "1000";
          textarea.style.borderWidth = object.strokeWidth.toString();
          textarea.style.borderColor = object.stroke;

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
