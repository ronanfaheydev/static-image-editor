import { ShapeObject } from "../types/editor";

export interface ShapeConfig {
  id: string;
  name: string;
  type: ShapeObject["shapeType"];
  icon?: string;
  defaultProps?: Partial<ShapeObject>;
}

export const SHAPE_CONFIGS: ShapeConfig[] = [
  {
    id: "rectangle",
    name: "Rectangle",
    type: "rectangle",
    defaultProps: {
      fill: "#cccccc",
      stroke: "#000000",
      strokeWidth: 2,
    },
  },
  {
    id: "circle",
    name: "Circle",
    type: "circle",
    defaultProps: {
      fill: "#cccccc",
      stroke: "#000000",
      strokeWidth: 2,
    },
  },
  {
    id: "star",
    name: "Star",
    type: "star",
    defaultProps: {
      fill: "#cccccc",
      stroke: "#000000",
      strokeWidth: 2,
      numPoints: 5,
      innerRadius: 20,
      outerRadius: 40,
    },
  },
  {
    id: "polygon",
    name: "Polygon",
    type: "polygon",
    defaultProps: {
      fill: "#cccccc",
      stroke: "#000000",
      strokeWidth: 2,
      sides: 6,
      radius: 40,
    },
  },
  {
    id: "line",
    name: "Line",
    type: "line",
    defaultProps: {
      stroke: "#000000",
      strokeWidth: 2,
      points: [0, 0, 100, 0],
    },
  },
];
