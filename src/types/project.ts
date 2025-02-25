import { EditorObjectBase, FormatEditMode } from "./editor";
import { Format } from "./format";
import { MediaItem } from "./media";
import type Konva from "konva";
import { Template } from "./template";

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
  preview: {
    isOpen: boolean;
    props: Record<string, unknown>;
    open: () => void;
    close: () => void;
  };
  export: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      objects: EditorObjectBase[];
    };
    open: () => void;
    close: () => void;
  };
  save: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      customFormats: Format[];
      objects: EditorObjectBase[];
    };
    open: () => void;
    close: () => void;
  };
  load: {
    isOpen: boolean;
    props: { onLoad?: (project: Project) => void };
    open: () => void;
    close: () => void;
  };
  exportJSON: {
    isOpen: boolean;
    props: { project?: Project };
    open: () => void;
    close: () => void;
  };
  templateBrowser: {
    isOpen: boolean;
    props: { onSelect?: (template: Template) => void };
    open: () => void;
    close: () => void;
  };
  saveTemplate: {
    isOpen: boolean;
    props: {
      objects?: EditorObjectBase[];
      currentFormat?: Format;
      onSaved?: (template: Template) => void;
    };
    open: () => void;
    close: () => void;
  };
  mediaLibrary: {
    isOpen: boolean;
    props: {
      onSelect: (mediaItem: MediaItem) => void;
    };
    open: () => void;
    close: () => void;
  };
}

// Add this type near other interfaces
export type DialogKey = keyof DialogState;

export interface DialogProps {
  onClose: () => void;
  stage?: Konva.Stage;
}
