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

export interface EditorObjectBase {
  id: string;
  type: "image" | "text" | "shape" | "group" | "root";
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  visible: boolean;
  name: string;
  zIndex: number;
  blendMode: BlendMode;
  parentId: string | null;
  children: EditorObjectBase[];
  isExpanded: boolean;
  isRoot: boolean;
}

export interface ImageObject extends EditorObjectBase {
  type: "image";
  src: string;
}

export interface TextObject extends EditorObjectBase {
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

export interface ShapeObject extends EditorObjectBase {
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

export interface GroupObject {
  id: string;
  type: "group";
  name: string;
  visible: boolean;
  zIndex: number;
  children: EditorObjectBase[];
  isExpanded?: boolean;
}

export type EditorObject = ImageObject | TextObject | ShapeObject | GroupObject;
