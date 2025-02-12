import { EditorObjectBase } from "./editor";
import { Format } from "./format";

export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  format: Format;
  objects: EditorObjectBase[];
  thumbnail?: string;
  tags: string[];
  category: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_CATEGORIES: TemplateCategory[] = [
  {
    id: "social",
    name: "Social Media",
    description: "Templates for social media posts",
  },
  {
    id: "ads",
    name: "Advertisements",
    description: "Templates for digital ads",
  },
  {
    id: "presentations",
    name: "Presentations",
    description: "Templates for slides and presentations",
  },
  { id: "custom", name: "Custom", description: "User-created templates" },
];
