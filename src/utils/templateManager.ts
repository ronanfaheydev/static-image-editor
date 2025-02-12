import { Template } from "../types/template";
import { Stage } from "konva/lib/Stage";

const STORAGE_KEY = "image-editor-templates";

export const saveTemplate = async (
  name: string,
  description: string,
  category: string,
  tags: string[],
  format: Template["format"],
  objects: Template["objects"],
  stage: Stage | null
): Promise<Template> => {
  const templates = await loadAllTemplates();

  // Create thumbnail
  let thumbnail: string | undefined;
  if (stage) {
    thumbnail = stage.toDataURL({
      pixelRatio: 0.1,
      mimeType: "image/jpeg",
      quality: 0.3,
    });
  }

  const newTemplate: Template = {
    id: `template-${Date.now()}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    format,
    objects,
    thumbnail,
    tags,
    category,
  };

  // Save template
  const updatedTemplates = [...templates, newTemplate];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));

  return newTemplate;
};

export const loadTemplate = async (id: string): Promise<Template | null> => {
  const templates = await loadAllTemplates();
  return templates.find((t) => t.id === id) || null;
};

export const loadAllTemplates = async (): Promise<Template[]> => {
  const templatesJson = localStorage.getItem(STORAGE_KEY);
  return templatesJson ? JSON.parse(templatesJson) : [];
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const templates = await loadAllTemplates();
  const updatedTemplates = templates.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
};

export const getTemplatesByCategory = async (
  category: string
): Promise<Template[]> => {
  const templates = await loadAllTemplates();
  return templates.filter((t) => t.category === category);
};

export const searchTemplates = async (query: string): Promise<Template[]> => {
  const templates = await loadAllTemplates();
  const lowercaseQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
};
