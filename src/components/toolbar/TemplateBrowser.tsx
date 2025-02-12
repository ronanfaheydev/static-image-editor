import React, { useState, useEffect } from "react";
import { Template, DEFAULT_CATEGORIES } from "../../types/template";
import {
  loadAllTemplates,
  deleteTemplate,
  searchTemplates,
  getTemplatesByCategory,
} from "../../utils/templateManager";
import "./TemplateBrowser.scss";

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  isOpen,
  onClose,
  onSelect,
  openDialog,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const loadedTemplates = await loadAllTemplates();
    setTemplates(loadedTemplates);
    setIsLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchTemplates(query);
      setTemplates(results);
    } else {
      loadTemplates();
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    if (category === "all") {
      loadTemplates();
    } else {
      const filteredTemplates = await getTemplatesByCategory(category);
      setTemplates(filteredTemplates);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="template-browser-modal">
          <div className="template-browser-content">
            <div className="template-browser-header">
              <h3>Templates</h3>
              <div className="template-actions">
                <button
                  onClick={() => {
                    onClose();
                    openDialog("saveTemplate");
                  }}
                  className="action-button"
                >
                  Create new template from current
                </button>
                <button
                  onClick={() => {
                    onClose();
                    openDialog("loadTemplate");
                  }}
                  className="action-button"
                >
                  Load template
                </button>
              </div>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="template-search"
              />
            </div>

            <div className="template-categories">
              <button
                className={selectedCategory === "all" ? "active" : ""}
                onClick={() => handleCategoryChange("all")}
              >
                All Templates
              </button>
              {DEFAULT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={selectedCategory === category.id ? "active" : ""}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div>Loading templates...</div>
            ) : templates.length === 0 ? (
              <div>No templates found</div>
            ) : (
              <div className="template-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="template-item"
                    onClick={() => onSelect(template)}
                  >
                    {template.thumbnail && (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="template-thumbnail"
                      />
                    )}
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <div className="template-tags">
                        {template.tags.map((tag) => (
                          <span key={tag} className="template-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
