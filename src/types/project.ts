import { EditorObjectBase } from "./editor";
import { Format } from "./format";
import { MediaItem } from "./media";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentFormat: Format;
  customFormats: Format[];
  objects: EditorObjectBase[];
  lastModified: Date;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

// Types
export interface EditorState {
  selectedIds: string[];
  tool: "select" | "image" | "text" | "shape";
  zoom: number;
  formatEditMode: FormatEditMode;
  backgroundColor: string;
  backgroundOpacity: number;
}

// Add these type definitions at the top with other interfaces
export type PositionProp = "position" | "size" | "rotation";
export type EditorObjectKey = keyof EditorObjectBase;

// Add at the top with other interfaces
export interface DialogState {
  preview: { isOpen: boolean; props: Record<string, unknown> };
  export: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      objects: EditorObjectBase[];
    };
  };
  save: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      customFormats: Format[];
      objects: EditorObjectBase[];
    };
  };
  load: {
    isOpen: boolean;
    props: { onLoad?: (project: Project) => void };
  };
  exportJSON: {
    isOpen: boolean;
    props: { project?: Project };
  };
  templateBrowser: {
    isOpen: boolean;
    props: { onSelect?: (template: Template) => void };
  };
  saveTemplate: {
    isOpen: boolean;
    props: {
      objects?: EditorObjectBase[];
      currentFormat?: Format;
      onSaved?: () => void;
    };
  };
  mediaLibrary: {
    isOpen: boolean;
    props: {
      onSelect: (mediaItem: MediaItem) => void;
    };
  };
}

// Add this type near other interfaces
export type DialogKey = keyof DialogState;
