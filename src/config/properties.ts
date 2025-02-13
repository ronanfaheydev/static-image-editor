import { EditorObjectBase } from "../types/editor";

export type PropertyType =
  | "number"
  | "text"
  | "color"
  | "select"
  | "range"
  | "position"
  | "size";

export interface PropertyConfig {
  id: string;
  label: string;
  type: PropertyType;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  group: string;
}

export interface PropertyGroupConfig {
  id: string;
  title: string;
  defaultOpen?: boolean;
}

export const PROPERTY_GROUPS: PropertyGroupConfig[] = [
  { id: "position", title: "Position & Size", defaultOpen: true },
  { id: "text", title: "Text", defaultOpen: true },
  { id: "appearance", title: "Appearance", defaultOpen: true },
  { id: "border", title: "Border", defaultOpen: true },
];

export const OBJECT_PROPERTIES: Record<string, PropertyConfig[]> = {
  image: [
    {
      id: "position.x",
      label: "X",
      type: "number",
      group: "position",
    },
    {
      id: "position.y",
      label: "Y",
      type: "number",
      group: "position",
    },
    {
      id: "size.width",
      label: "Width",
      type: "number",
      group: "position",
    },
    {
      id: "size.height",
      label: "Height",
      type: "number",
      group: "position",
    },
    {
      id: "rotation",
      label: "Rotation",
      type: "number",
      group: "position",
    },
    {
      id: "opacity",
      label: "Opacity",
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      group: "appearance",
    },
    {
      id: "blendMode",
      label: "Blend Mode",
      type: "select",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
        // ... other blend modes
      ],
      group: "appearance",
    },
    {
      id: "borderRadius",
      label: "Border Radius",
      type: "number",
      min: 0,
      group: "border",
    },
    {
      id: "borderWidth",
      label: "Border Width",
      type: "number",
      min: 0,
      group: "border",
    },
    {
      id: "borderColor",
      label: "Border Color",
      type: "color",
      group: "border",
    },
  ],
  text: [
    {
      id: "position.x",
      label: "X",
      type: "number",
      group: "position",
    },
    {
      id: "position.y",
      label: "Y",
      type: "number",
      group: "position",
    },
    {
      id: "size.width",
      label: "Width",
      type: "number",
      group: "position",
    },
    {
      id: "size.height",
      label: "Height",
      type: "number",
      group: "position",
    },
    {
      id: "rotation",
      label: "Rotation",
      type: "number",
      group: "position",
    },
    {
      id: "text",
      label: "Text Content",
      type: "text",
      group: "text",
    },
    {
      id: "fontSize",
      label: "Font Size",
      type: "number",
      min: 1,
      group: "text",
    },
    {
      id: "fontFamily",
      label: "Font Family",
      type: "select",
      options: [
        { value: "Arial", label: "Arial" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Courier New", label: "Courier New" },
      ],
      group: "text",
    },
    {
      id: "fill",
      label: "Color",
      type: "color",
      group: "text",
    },
    {
      id: "opacity",
      label: "Opacity",
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      group: "appearance",
    },
    {
      id: "blendMode",
      label: "Blend Mode",
      type: "select",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
      ],
      group: "appearance",
    },
  ],
  shape: [
    {
      id: "position.x",
      label: "X",
      type: "number",
      group: "position",
    },
    {
      id: "position.y",
      label: "Y",
      type: "number",
      group: "position",
    },
    {
      id: "size.width",
      label: "Width",
      type: "number",
      group: "position",
    },
    {
      id: "size.height",
      label: "Height",
      type: "number",
      group: "position",
    },
    {
      id: "rotation",
      label: "Rotation",
      type: "number",
      group: "position",
    },
    {
      id: "fill",
      label: "Fill Color",
      type: "color",
      group: "appearance",
    },
    {
      id: "stroke",
      label: "Stroke Color",
      type: "color",
      group: "appearance",
    },
    {
      id: "strokeWidth",
      label: "Stroke Width",
      type: "number",
      min: 0,
      group: "appearance",
    },
    {
      id: "opacity",
      label: "Opacity",
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      group: "appearance",
    },
    {
      id: "blendMode",
      label: "Blend Mode",
      type: "select",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
      ],
      group: "appearance",
    },
  ],
};

export const getPropertyValue = (
  object: EditorObjectBase,
  propertyId: string
) => {
  const parts = propertyId.split(".");
  let value: any = object;
  for (const part of parts) {
    value = value[part];
  }
  return value;
};

export const setPropertyValue = (
  object: EditorObjectBase,
  propertyId: string,
  value: any
): Partial<EditorObjectBase> => {
  const parts = propertyId.split(".");
  const result: any = {};
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...object[parts[i]] };
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
  return result;
};
