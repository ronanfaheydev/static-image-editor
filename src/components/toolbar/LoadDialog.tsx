import React from "react";
import { useEffect, useState } from "react";
import { Project } from "../../types/project";
import { loadProjects } from "../../utils/projectManager";
import "./LoadDialog.scss";
interface LoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (project: Project) => void;
}

export const LoadDialog: React.FC<LoadDialogProps> = ({
  isOpen,
  onClose,
  onLoad,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProjects(loadProjects());
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project = JSON.parse(event.target?.result as string);
          onLoad(project);
        } catch (error) {
          alert("Invalid project file");
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="load-modal">
      <div className="load-modal-content">
        <h3>Load Project</h3>
        <div className="import-section">
          <h4>Import from JSON</h4>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ marginBottom: "1rem" }}
          />
        </div>
        <div className="saved-projects-section">
          <h4>Saved Projects</h4>
          {projects.length === 0 ? (
            <p>No saved projects found</p>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="project-item"
                  onClick={() => onLoad(project)}
                >
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p>
                      Last modified:{" "}
                      {new Date(project.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
