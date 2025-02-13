import React, { useCallback, useState } from "react";
import { EditorObjectBase, EditorState } from "../types/editor";
import "./PropertyPanel.scss";
import { Accordion } from "./common/Accordion";
import {
  PROPERTY_GROUPS,
  OBJECT_PROPERTIES,
  getPropertyValue,
  setPropertyValue,
  PropertyConfig,
} from "../config/properties";
import { ResizeOptions } from "./common/ResizeOptions";
import { CropModal } from "./modals/CropModal";
import { AlignmentOptions } from "./common/AlignmentOptions";

interface PropertyPanelProps {
  selectedObject: EditorObjectBase | null;
  objects: EditorObjectBase[];
  onChange: (id: string, changes: Partial<EditorObjectBase>) => void;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  getCanvasSize: () => { width: number; height: number };
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedObject,
  objects,
  onChange,
  editorState,
  setEditorState,
  getCanvasSize,
}) => {
  const [showCropModal, setShowCropModal] = useState(false);

  const handleBackgroundChange = (changes: Partial<EditorState>) => {
    const newState = {
      ...editorState,
      ...changes,
    };
    setEditorState(newState);
  };

  const renderPropertyInput = useCallback(
    (config: PropertyConfig, value: any, _onChange: (value: any) => void) => {
      switch (config.type) {
        case "number":
          return (
            <input
              type="number"
              value={value}
              min={config.min}
              max={config.max}
              step={config.step}
              onChange={(e) => _onChange(Number(e.target.value))}
            />
          );
        case "range":
          return (
            <input
              type="range"
              value={value}
              min={config.min}
              max={config.max}
              step={config.step}
              onChange={(e) => _onChange(Number(e.target.value))}
            />
          );
        case "color":
          return (
            <input
              type="color"
              value={value}
              onChange={(e) => _onChange(e.target.value)}
            />
          );
        case "select":
          return (
            <select value={value} onChange={(e) => _onChange(e.target.value)}>
              {config.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        case "resize":
          if (selectedObject?.type !== "image") return null;
          return (
            <ResizeOptions
              object={selectedObject}
              canvasSize={getCanvasSize()}
              onResize={(newSize) => {
                if (!selectedObject) return;
                onChange(selectedObject.id, {
                  size: {
                    width: newSize.width,
                    height: newSize.height,
                  },
                  position: {
                    x: newSize.x,
                    y: newSize.y,
                  },
                });
              }}
              onCrop={() => setShowCropModal(true)}
            />
          );
        case "alignment":
          return (
            <AlignmentOptions
              onAlign={(alignment) => {
                if (!selectedObject) return;

                const rootObject = objects.find(
                  (obj) => obj.id === "canvas-background"
                );
                if (!rootObject) return;

                const newPosition = { ...selectedObject.position };

                switch (alignment) {
                  case "left":
                    newPosition.x = rootObject.position.x;
                    break;
                  case "center":
                    newPosition.x =
                      rootObject.position.x +
                      (rootObject.size.width - selectedObject.size.width) / 2;
                    break;
                  case "right":
                    newPosition.x =
                      rootObject.position.x +
                      rootObject.size.width -
                      selectedObject.size.width;
                    break;
                  case "top":
                    newPosition.y = rootObject.position.y;
                    break;
                  case "middle":
                    newPosition.y =
                      rootObject.position.y +
                      (rootObject.size.height - selectedObject.size.height) / 2;
                    break;
                  case "bottom":
                    newPosition.y =
                      rootObject.position.y +
                      rootObject.size.height -
                      selectedObject.size.height;
                    break;
                }

                onChange(selectedObject.id, { position: newPosition });
              }}
            />
          );
        default:
          return null;
      }
    },
    [selectedObject, getCanvasSize, onChange, objects]
  );

  const renderObjectProperties = useCallback(
    (
      object: EditorObjectBase
      // _onChange: (id: string, changes: Partial<EditorObjectBase>) => void
    ) => {
      const properties = OBJECT_PROPERTIES[object.type];
      if (!properties) return null;

      return PROPERTY_GROUPS.map((group) => {
        const groupProperties = properties.filter((p) => p.group === group.id);
        if (groupProperties.length === 0) return null;

        return (
          <Accordion
            key={group.id}
            title={group.title}
            defaultOpen={group.defaultOpen}
          >
            <div className="property-grid">
              {groupProperties.map((prop) => (
                <div key={prop.id} className="property-row">
                  <label>{prop.label}</label>
                  {renderPropertyInput(
                    prop,
                    getPropertyValue(object, prop.id),
                    (value) =>
                      onChange(
                        object.id,
                        setPropertyValue(object, prop.id, value)
                      )
                  )}
                </div>
              ))}
            </div>
          </Accordion>
        );
      });
    },
    [renderPropertyInput, onChange]
  );

  if (!selectedObject) {
    return (
      <div className="property-panel">
        <h3>Canvas Properties</h3>
        <div className="property-group">
          <div className="property-group-label">Background</div>
          <div className="property-item">
            <label>Color</label>
            <input
              type="color"
              value={editorState.backgroundColor}
              onChange={(e) =>
                handleBackgroundChange({ backgroundColor: e.target.value })
              }
            />
          </div>
          <div className="property-item">
            <label>Opacity</label>
            <div className="property-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={editorState.backgroundOpacity}
                onChange={(e) =>
                  handleBackgroundChange({
                    backgroundOpacity: parseFloat(e.target.value),
                  })
                }
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={editorState.backgroundOpacity}
                onChange={(e) => {
                  // Direct state update
                  setEditorState({
                    ...editorState,
                    backgroundOpacity: parseFloat(e.target.value),
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-panel">
      <h3>Properties</h3>
      {!selectedObject ? (
        <p className="no-selection">No object selected</p>
      ) : (
        <>
          {renderObjectProperties(selectedObject, onChange)}

          {selectedObject.type === "image" && (
            <div className="property-section">
              <div className="preview-container">
                <img
                  src={selectedObject.src}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    borderRadius: selectedObject?.borderRadius || 0,
                    border: selectedObject?.borderWidth
                      ? `${selectedObject.borderWidth}px solid ${
                          selectedObject.borderColor || "#000"
                        }`
                      : "none",
                  }}
                />
              </div>
            </div>
          )}

          {showCropModal && selectedObject?.type === "image" && (
            <CropModal
              src={selectedObject.src}
              onClose={() => setShowCropModal(false)}
              onCrop={(croppedImageUrl) => {
                onChange(selectedObject.id, {
                  src: croppedImageUrl,
                });
              }}
            />
          )}
        </>
      )}
      <div className="panel-resize-handle" />
    </div>
  );
};
