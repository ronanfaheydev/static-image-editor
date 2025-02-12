import React from "react";
import { Project } from "../../types/project";

interface ExportJSONDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportJSONDialog: React.FC<ExportJSONDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const handleDownload = () => {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "project"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Export Project as JSON</h3>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button type="submit" onClick={handleDownload}>
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
};
