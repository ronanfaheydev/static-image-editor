import React, { useCallback, useState, useRef, useEffect } from "react";
import { Format } from "../../types/format";
import { EditorObjectBase } from "../../types/editor";
import { Layer, Stage, Rect } from "react-konva";
import { ImageObjectComponent } from "../shapes/ImageObject";
import { TextObjectComponent } from "../shapes/TextObject";
import { ShapeObjectComponent } from "../shapes/ShapeObject";
import "./ExportDialog.scss";
import type Konva from "konva";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Konva.Stage | null;
  currentFormat: Format;
  objects: EditorObjectBase[];
}

interface ExportOptions {
  format: "png" | "jpeg";
  quality: number;
  pixelRatio: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  stage,
  currentFormat,
  objects,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: "png",
    quality: 1,
    pixelRatio: 2,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  // Calculate preview size to fit in dialog
  useEffect(() => {
    if (!previewRef.current) return;
    const maxWidth = previewRef.current.clientWidth;
    const maxHeight = 300; // Max preview height
    const scale = Math.min(
      maxWidth / currentFormat.width,
      maxHeight / currentFormat.height
    );
    setPreviewSize({
      width: currentFormat.width * scale,
      height: currentFormat.height * scale,
    });
  }, [currentFormat, previewRef]);

  const handleExport = useCallback(() => {
    if (!stage) return;

    // Calculate format area position
    const formatX = (stage.width() - currentFormat.width) / 2;
    const formatY = (stage.height() - currentFormat.height) / 2;

    // Hide all transformers (selection outlines)
    const transformers = stage.find("Transformer");
    transformers.forEach((transformer: Konva.Transformer) =>
      transformer.hide()
    );

    // Create a temporary layer for clipping
    const layer = stage.findOne("Layer");
    const oldClip = layer.clipFunc();

    // Set clipping to format area
    layer.clipFunc((ctx: Konva.Context) => {
      ctx.beginPath();
      ctx.rect(formatX, formatY, currentFormat.width, currentFormat.height);
      ctx.closePath();
    });

    // Export with clipping
    const dataURL = stage.toDataURL({
      x: formatX,
      y: formatY,
      width: currentFormat.width,
      height: currentFormat.height,
      pixelRatio: options.pixelRatio,
      mimeType: `image/${options.format}`,
      quality: options.quality,
    });

    // Restore original state
    layer.clipFunc(oldClip);
    transformers.forEach((transformer: Konva.Transformer) =>
      transformer.show()
    );

    // Download
    const link = document.createElement("a");
    link.download = `export.${options.format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  }, [stage, currentFormat, options, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Export Image</h2>

        <div ref={previewRef} className="export-preview">
          <Stage
            width={previewSize.width}
            height={previewSize.height}
            scale={{
              x: previewSize.width / currentFormat.width,
              y: previewSize.height / currentFormat.height,
            }}
          >
            <Layer>
              <Rect
                width={currentFormat.width}
                height={currentFormat.height}
                fill={
                  stage?.findOne("Layer").findOne("Rect").attrs.fill ||
                  "#ffffff"
                }
                opacity={
                  stage?.findOne("Layer").findOne("Rect").attrs.opacity || 1
                }
              />
              {objects
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((obj) => {
                  if (!obj.visible) return null;
                  if (obj.type === "image") {
                    return (
                      <ImageObjectComponent
                        key={obj.id}
                        object={obj as ImageObject}
                        isSelected={false}
                        onSelect={() => {}}
                        onChange={() => {}}
                      />
                    );
                  }
                  if (obj.type === "text") {
                    return (
                      <TextObjectComponent
                        key={obj.id}
                        object={obj as TextObject}
                        isSelected={false}
                        onSelect={() => {}}
                        onChange={() => {}}
                      />
                    );
                  }
                  if (obj.type === "shape") {
                    return (
                      <ShapeObjectComponent
                        key={obj.id}
                        object={obj as ShapeObject}
                        isSelected={false}
                        onSelect={() => {}}
                        onChange={() => {}}
                      />
                    );
                  }
                  return null;
                })}
            </Layer>
          </Stage>
        </div>

        <div className="export-options">
          <label>
            Format:
            <select
              value={options.format}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  format: e.target.value as "png" | "jpeg",
                }))
              }
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </label>

          {options.format === "jpeg" && (
            <label>
              Quality:
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={options.quality}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    quality: parseFloat(e.target.value),
                  }))
                }
              />
              <span>{Math.round(options.quality * 100)}%</span>
            </label>
          )}

          <label>
            Scale:
            <select
              value={options.pixelRatio}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  pixelRatio: parseFloat(e.target.value),
                }))
              }
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </label>

          <div className="export-info">
            <p>
              Output size: {currentFormat.width * options.pixelRatio}x
              {currentFormat.height * options.pixelRatio}px
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button type="submit" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
