export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "luminosity"
  | "color";

export interface EditorObject {
  id: string;
  type: "image" | "text" | "shape";
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  visible: boolean;
  name: string;
  zIndex: number;
  blendMode: BlendMode;
}

export interface ImageObject extends EditorObject {
  type: "image";
  src: string;
}

export interface TextObject extends EditorObject {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface ShapeObject extends EditorObject {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line" | "star";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type FormatEditMode = "single" | "all";

export interface EditorState {
  selectedIds: string[];
  tool: "select" | "image" | "text" | "shape";
  zoom: number;
  formatEditMode: FormatEditMode;
  backgroundColor: string;
  backgroundOpacity: number;
}
