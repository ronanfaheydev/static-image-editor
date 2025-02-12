import React from "react";
import { Stage, Layer } from "react-konva";
import { Format } from "../../types/format";
import { EditorObject } from "../../types/editor";
import { ImageObjectComponent } from "../shapes/ImageObject";
import { TextObjectComponent } from "../shapes/TextObject";
import { ShapeObjectComponent } from "../shapes/ShapeObject";
import "./PreviewDialog.scss";

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  objects: EditorObject[];
  formats: Format[];
  customFormats: Format[];
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({
  isOpen,
  onClose,
  objects,
  formats,
  customFormats,
}) => {
  if (!isOpen) return null;

  const allFormats = [...formats, ...customFormats];

  return (
    <div className="preview-modal">
      <div className="preview-modal-content">
        <div className="preview-header">
          <h3>Preview All Formats</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="preview-grid">
          {allFormats.map((format) => (
            <div key={format.id} className="preview-item">
              <h4>{format.name}</h4>
              <div className="preview-canvas-wrapper">
                <Stage
                  width={format.width}
                  height={format.height}
                  scaleX={200 / format.width} // Scale to fit preview
                  scaleY={200 / format.width}
                >
                  <Layer>
                    {objects
                      .sort((a, b) => a.zIndex - b.zIndex)
                      .map((obj) => {
                        if (!obj.visible) return null;
                        if (obj.type === "image") {
                          return (
                            <ImageObjectComponent
                              key={obj.id}
                              object={obj}
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
                              object={obj}
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
                              object={obj}
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
              <div className="preview-info">
                {format.width}x{format.height}px
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
