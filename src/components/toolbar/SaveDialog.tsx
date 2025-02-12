import React, { useState } from "react";
import { Stage } from "konva/lib/Stage";
import { Format } from "../../types/format";
import { EditorObject } from "../../types/editor";
import { saveProject } from "../../utils/projectManager";
import { Project } from "../../types/project";
import "./SaveDialog.scss";

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage | null;
  currentFormat: Format;
  customFormats: Format[];
  objects: EditorObject[];
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  stage,
  currentFormat,
  customFormats,
  objects,
}) => {
  const [projectName, setProjectName] = useState("");

  const handleSave = async () => {
    const project: Project = {
      id: Date.now().toString(),
      name: projectName,
      objects,
      currentFormat,
      customFormats,
      lastModified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveProject(project);
    onClose();
    setProjectName("");
  };

  if (!isOpen) return null;

  return (
    <div className="save-modal">
      <div className="save-modal-content">
        <h3>Save Project</h3>
        <div className="form-group">
          <label>Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={!projectName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
