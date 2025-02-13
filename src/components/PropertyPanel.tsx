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
    onChange: (id: string, changes: Partial<EditorObjectBase>) => void
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
