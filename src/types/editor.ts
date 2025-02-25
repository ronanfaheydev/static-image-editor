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

export type TreeNodeType =
  | "layer"
  | "group"
  | "image"
  | "text"
  | "shape"
  | "root";

export interface TreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  visible: boolean;
  children: TreeNode[];
  isExpanded?: boolean;
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  zIndex: number;
  parentId: string | null;
  blendMode?: BlendMode;
}

export type EditorObjectBase = TreeNode;

export interface LayerObject extends TreeNode {
  type: "layer";
  children: TreeNode[];
}

export interface GroupObject extends TreeNode {
  type: "group";
  children: TreeNode[];
}

export interface ImageObject extends TreeNode {
  type: "image";
  src: string;
  children: never[];
  blendMode: BlendMode;
}

export interface TextObject extends TreeNode {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  stroke: string;
  strokeWidth: number;
  children: never[];
  blendMode: BlendMode;
}

export interface ShapeObject extends TreeNode {
  type: "shape";
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  curveConfig?: CurveConfig;
  children: never[];
  blendMode: BlendMode;
}

export interface RootObject extends TreeNode {
  type: "root";
  backgroundColor: string;
  backgroundOpacity: number;
}

export type EditorNode =
  | RootObject
  | LayerObject
  | GroupObject
  | ImageObject
  | TextObject
  | ShapeObject;

export type ShapeType = "rectangle" | "circle" | "star" | "line" | "curve";

export interface CurveConfig {
  points: number[];
  tension: number;
  closed: boolean;
}

export type FormatEditMode = "single" | "all";

export interface EditorState {
  selectedIds: string[];
  tool: "select" | "image" | "text" | "shape";
  zoom: number;
  formatEditMode: FormatEditMode;
  backgroundColor: string;
  backgroundOpacity: number;
  selectedLayerId: string | null;
  isDrawing: boolean;
  drawStartPosition: Position | null;
  selectedShapeType?: ShapeType;
  drawPreview: EditorObjectBase | null;
}
