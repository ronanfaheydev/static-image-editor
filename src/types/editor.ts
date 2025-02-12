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
  fontSize?: number;
  fontFamily?: string;
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

export type ShapeType = "rectangle" | "circle" | "star" | "line" | "curve";

export interface CurveConfig {
  points: number[];
  tension: number;
  closed: boolean;
}

export interface ShapeObject extends EditorObject {
  type: "shape";
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  curveConfig?: CurveConfig;
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
