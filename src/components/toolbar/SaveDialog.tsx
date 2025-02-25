import React from "react";
import { Stage } from "konva/lib/Stage";
import { Format } from "../../types/format";
import { EditorObjectBase } from "../../types/editor";
import "./SaveDialog.scss";
import { DialogKey } from "../../types/project";

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage | null;
  currentFormat: Format;
  objects: EditorObjectBase[];
  openDialog: (dialogName: DialogKey) => void;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  stage,
  currentFormat,
  objects,
  openDialog,
}) => {
  if (!isOpen) return null;

  const handleSaveAsTemplate = () => {
    onClose();
    openDialog("saveTemplate");
  };

  const handleSaveAsImage = () => {
    onClose();
    openDialog("export");
  };

  const handleSaveAsJSON = () => {
    const projectData = {
      objects,
      currentFormat,
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creative-" + Date.now() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="save-modal">
        <div className="save-modal-header">
          <h2>Save Project</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="save-modal-preview">
          {stage && (
            <img
              src={stage.toDataURL()}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                objectFit: "contain",
              }}
            />
          )}
        </div>

        <div className="save-modal-options">
          <button onClick={handleSaveAsTemplate}>Save as Template</button>
          <button onClick={handleSaveAsImage}>Save as Image</button>
          <button onClick={handleSaveAsJSON}>Save as JSON</button>
        </div>
      </div>
    </div>
  );
};
