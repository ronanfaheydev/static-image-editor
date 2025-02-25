import React, { useCallback, useMemo, useState } from "react";
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
import { findNodeById } from "../utils/treeUtils";
import { ROOT_ID } from "../constants";

interface PropertyPanelProps {
  selectedIds: string[];
  objects: EditorObjectBase[];
  onChange: (id: string, changes: Partial<EditorObjectBase>) => void;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  getCanvasSize: () => { width: number; height: number };
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedIds,
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

  // Wrap getSelectedObject
  const getSelectedObjects = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return [];
      const ret = [];
      for (const id of selectedIds) {
        const obj = findNodeById(objects, id);
        if (obj) {
          ret.push(obj);
        }
      }
      return ret;
    },
    [objects]
  );

  const selectedObjects = useMemo(() => {
    return getSelectedObjects(selectedIds);
  }, [getSelectedObjects, selectedIds]);

  const renderPropertyInput = useCallback(
    (config: PropertyConfig, value: any, _onChange: (value: any) => void) => {
      // TODO: intersection of object properties and config
      const isOnlyImageType = selectedObjects[0]?.type === "image";
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return null;

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
          if (!isOnlyImageType) return null;
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
                selectedObjects.forEach((selectedObject) => {
                  if (!selectedObject) return;

                  const rootObject = findNodeById(objects, ROOT_ID);
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
                        (rootObject.size.height - selectedObject.size.height) /
                          2;
                      break;
                    case "bottom":
                      newPosition.y =
                        rootObject.position.y +
                        rootObject.size.height -
                        selectedObject.size.height;
                      break;
                  }

                  onChange(selectedObject.id, { position: newPosition });
                });
              }}
            />
          );
        default:
          return null;
      }
    },
    [selectedObjects, getCanvasSize, onChange, objects]
  );

  const renderObjectProperties = useCallback(
    (
      objects: EditorObjectBase[],
      onChange: (id: string, changes: Partial<EditorObjectBase>) => void
    ) => {
      const allProperties = objects.map(
        (object) => OBJECT_PROPERTIES[object.type]
      );
      const commonProperties = allProperties.reduce((acc, properties) => {
        if (!properties) return acc;
        return acc.filter((p) => properties.some((prop) => prop.id === p.id));
      }, allProperties[0] || []);

      if (!commonProperties) return null;

      return PROPERTY_GROUPS.map((group) => {
        const groupProperties = commonProperties.filter(
          (p) => p.group === group.id
        );
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
                    getPropertyValue(objects, prop.id),
                    (value) =>
                      objects.forEach((object) => {
                        onChange(
                          object.id,
                          setPropertyValue(object, prop.id, value)
                        );
                      })
                  )}
                </div>
              ))}
            </div>
          </Accordion>
        );
      });
    },
    [renderPropertyInput]
  );

  if (!selectedObjects?.length) {
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
      {!selectedObjects?.length ? (
        <p className="no-selection">No object selected</p>
      ) : (
        <>
          {renderObjectProperties(selectedObjects, onChange)}

          {selectedObjects.length === 1 &&
            selectedObjects[0].type === "image" && (
              <div className="property-section">
                <div className="preview-container">
                  <img
                    src={selectedObjects[0].src}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      borderRadius: selectedObjects[0]?.borderRadius || 0,
                      border: selectedObjects[0]?.borderWidth
                        ? `${selectedObjects[0].borderWidth}px solid ${
                            selectedObjects[0].borderColor || "#000"
                          }`
                        : "none",
                    }}
                  />
                </div>
              </div>
            )}

          {showCropModal &&
            selectedObjects.length === 1 &&
            selectedObjects[0] && (
              <CropModal
                src={selectedObjects[0].src}
                onClose={() => setShowCropModal(false)}
                onCrop={(croppedImageUrl) => {
                  onChange(selectedObjects[0].id, {
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
