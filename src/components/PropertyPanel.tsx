import React from "react";
import {
  EditorObjectBase,
  TextObject,
  ShapeObject,
  BlendMode,
  EditorState,
} from "../types/editor";
import "./PropertyPanel.scss";
import { Accordion } from "./common/Accordion";
import {
  PROPERTY_GROUPS,
  OBJECT_PROPERTIES,
  getPropertyValue,
  setPropertyValue,
} from "../config/properties";

interface PropertyPanelProps {
  selectedObject: EditorObjectBase | null;
  onChange: (id: string, changes: Partial<EditorObjectBase>) => void;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedObject,
  onChange,
  editorState,
  setEditorState,
}) => {
  const handleBackgroundChange = (changes: Partial<EditorState>) => {
    console.log("Handling background change:", changes);
    const newState = {
      ...editorState,
      ...changes,
    };
    console.log("Setting new state:", newState);
    setEditorState(newState);
  };

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

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    property: keyof EditorObjectBase
  ) => {
    if (!selectedObject) return;
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onChange(selectedObject.id, { [property]: value });
    }
  };

  const renderCommonProperties = () => (
    <div className="property-group">
      <div className="property-group-label">Position & Size</div>
      <div className="position-properties">
        <div className="property-item">
          <label>X</label>
          <input
            type="number"
            value={selectedObject.position.x}
            onChange={(e) =>
              onChange(selectedObject.id, {
                position: {
                  ...selectedObject.position,
                  x: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="property-item">
          <label>Y</label>
          <input
            type="number"
            value={selectedObject.position.y}
            onChange={(e) =>
              onChange(selectedObject.id, {
                position: {
                  ...selectedObject.position,
                  y: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>
      <div className="size-properties">
        <div className="property-item">
          <label>Width</label>
          <input
            type="number"
            value={selectedObject.size.width}
            onChange={(e) =>
              onChange(selectedObject.id, {
                size: {
                  ...selectedObject.size,
                  width: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="property-item">
          <label>Height</label>
          <input
            type="number"
            value={selectedObject.size.height}
            onChange={(e) =>
              onChange(selectedObject.id, {
                size: {
                  ...selectedObject.size,
                  height: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>
      <div className="property-item">
        <label>Rotation</label>
        <input
          type="number"
          value={selectedObject.rotation}
          onChange={(e) => handleNumberChange(e, "rotation")}
        />
      </div>
      <div className="property-group-label">Appearance</div>
      <div className="property-item">
        <label>Opacity</label>
        <div className="property-row">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.opacity}
            onChange={(e) => handleNumberChange(e, "opacity")}
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={selectedObject.opacity}
            onChange={(e) => handleNumberChange(e, "opacity")}
            style={{ width: "60px" }}
          />
        </div>
      </div>
      <div className="property-item">
        <label>Blend Mode</label>
        <select
          value={selectedObject.blendMode}
          onChange={(e) =>
            onChange(selectedObject.id, {
              blendMode: e.target.value as BlendMode,
            })
          }
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
          <option value="color-dodge">Color Dodge</option>
          <option value="color-burn">Color Burn</option>
          <option value="hard-light">Hard Light</option>
          <option value="soft-light">Soft Light</option>
          <option value="difference">Difference</option>
          <option value="exclusion">Exclusion</option>
          <option value="luminosity">Luminosity</option>
          <option value="color">Color</option>
        </select>
      </div>
    </div>
  );

  const renderTextProperties = () => {
    const textObject = selectedObject as TextObject;
    return (
      <div className="property-group">
        <div className="property-group-label">Text</div>
        <div className="property-item">
          <label>Text Content</label>
          <input
            type="text"
            value={textObject.text}
            onChange={(e) =>
              onChange(selectedObject.id, { text: e.target.value })
            }
          />
        </div>
        <div className="property-item">
          <label>Font Size</label>
          <input
            type="number"
            value={textObject.fontSize}
            onChange={(e) =>
              onChange(selectedObject.id, {
                fontSize: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div className="property-item">
          <label>Font Family</label>
          <select
            value={textObject.fontFamily}
            onChange={(e) =>
              onChange(selectedObject.id, { fontFamily: e.target.value })
            }
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        <div className="property-item">
          <label>Color</label>
          <input
            type="color"
            value={textObject.fill}
            onChange={(e) =>
              onChange(selectedObject.id, { fill: e.target.value })
            }
          />
        </div>
      </div>
    );
  };

  const renderShapeProperties = () => {
    const shapeObject = selectedObject as ShapeObject;
    return (
      <div className="property-group">
        <div className="property-group-label">Shape</div>
        <div className="property-item">
          <label>Fill Color</label>
          <input
            type="color"
            value={shapeObject.fill}
            onChange={(e) =>
              onChange(selectedObject.id, { fill: e.target.value })
            }
          />
        </div>
        <div className="property-item">
          <label>Stroke Color</label>
          <input
            type="color"
            value={shapeObject.stroke}
            onChange={(e) =>
              onChange(selectedObject.id, { stroke: e.target.value })
            }
          />
        </div>
        <div className="property-item">
          <label>Stroke Width</label>
          <input
            type="number"
            value={shapeObject.strokeWidth}
            onChange={(e) =>
              onChange(selectedObject.id, {
                strokeWidth: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>
    );
  };

  const renderImageProperties = () => {
    if (selectedObject?.type !== "image") return null;

    return (
      <div className="property-section">
        {renderObjectProperties(selectedObject, onChange)}
        <Accordion title="Preview">
          <div className="preview-container">
            <img
              src={selectedObject.src}
              alt="Preview"
              style={{
                maxWidth: "100%",
                borderRadius: selectedObject.borderRadius || 0,
                border: selectedObject.borderWidth
                  ? `${selectedObject.borderWidth}px solid ${
                      selectedObject.borderColor || "#000"
                    }`
                  : "none",
              }}
            />
          </div>
        </Accordion>
      </div>
    );
  };

  const renderPropertyInput = (
    config: PropertyConfig,
    value: any,
    onChange: (value: any) => void
  ) => {
    switch (config.type) {
      case "number":
        return (
          <input
            type="number"
            value={value}
            min={config.min}
            max={config.max}
            step={config.step}
            onChange={(e) => onChange(Number(e.target.value))}
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
            onChange={(e) => onChange(Number(e.target.value))}
          />
        );
      case "color":
        return (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "select":
        return (
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {config.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const renderObjectProperties = (
    object: EditorObjectBase,
    onChange: (changes: Partial<EditorObjectBase>) => void
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
                  (value) => onChange(setPropertyValue(object, prop.id, value))
                )}
              </div>
            ))}
          </div>
        </Accordion>
      );
    });
  };

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
                    borderRadius: selectedObject.borderRadius || 0,
                    border: selectedObject.borderWidth
                      ? `${selectedObject.borderWidth}px solid ${
                          selectedObject.borderColor || "#000"
                        }`
                      : "none",
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
      <div className="panel-resize-handle" />
    </div>
  );
};
