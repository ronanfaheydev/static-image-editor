import { EditorObject } from "./editor";
import { Format } from "./format";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentFormat: Format;
  customFormats: Format[];
  objects: EditorObject[];
  lastModified: Date;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}
