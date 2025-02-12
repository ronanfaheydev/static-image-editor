import React, { useState } from "react";
import { Stage } from "konva/lib/Stage";
import { Format } from "../../types/format";
import { EditorObject } from "../../types/editor";
import { DEFAULT_CATEGORIES } from "../../types/template";
import { saveTemplate } from "../../utils/templateManager";

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage | null;
  currentFormat: Format;
  objects: EditorObject[];
  onSaved: () => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  onClose,
  stage,
  currentFormat,
  objects,
  onSaved,
}) => {
  const [templateDetails, setTemplateDetails] = useState({
    name: "",
    description: "",
    category: "custom",
    tags: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!templateDetails.name.trim()) {
      setError("Template name is required");
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate(
        templateDetails.name,
        templateDetails.description,
        templateDetails.category,
        templateDetails.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        currentFormat,
        objects,
        stage
      );
      onSaved();
      onClose();
    } catch (err) {
      setError("Failed to save template");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTemplateDetails((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="save-template-modal">
      <div className="save-template-content">
        <h3>Save as Template</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Template Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={templateDetails.name}
              onChange={handleChange}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={templateDetails.description}
              onChange={handleChange}
              placeholder="Enter template description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={templateDetails.category}
              onChange={handleChange}
            >
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={templateDetails.tags}
              onChange={handleChange}
              placeholder="Enter tags separated by commas"
            />
            <small>
              Separate tags with commas (e.g., social, facebook, square)
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="template-preview">
            <h4>Preview</h4>
            <div className="template-preview-info">
              <p>Format: {currentFormat.name}</p>
              <p>
                Size: {currentFormat.width}x{currentFormat.height}px
              </p>
              <p>Objects: {objects.length}</p>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Template"}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
