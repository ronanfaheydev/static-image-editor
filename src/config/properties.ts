import { EditorObjectBase } from "../types/editor";

export type PropertyType =
  | "number"
  | "text"
  | "color"
  | "select"
  | "range"
  | "position"
  | "size"
  | "resize"
  | "alignment";

export interface PropertyConfig {
  id: string;
  label: string;
  type: PropertyType;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean | undefined;
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

/*BLEND MORE PROPERTIES:

"source-over"
This is the default setting and draws new shapes on top of the existing canvas content.

"source-in"
The new shape is drawn only where both the new shape and the destination canvas overlap. Everything else is made transparent.

"source-out"
The new shape is drawn where it doesn't overlap the existing canvas content.

"source-atop"
The new shape is only drawn where it overlaps the existing canvas content.

"destination-over"
New shapes are drawn behind the existing canvas content.

"destination-in"
The existing canvas content is kept where both the new shape and existing canvas content overlap. Everything else is made transparent.

"destination-out"
The existing content is kept where it doesn't overlap the new shape.

"destination-atop"
The existing canvas is only kept where it overlaps the new shape. The new shape is drawn behind the canvas content.

"lighter"
Where both shapes overlap, the color is determined by adding color values.

"copy"
Only the new shape is shown.

"xor"
Shapes are made transparent where both overlap and drawn normal everywhere else.

"multiply"
The pixels of the top layer are multiplied with the corresponding pixels of the bottom layer. A darker picture is the result.

"screen"
The pixels are inverted, multiplied, and inverted again. A lighter picture is the result (opposite of multiply)

"overlay"
A combination of multiply and screen. Dark parts on the base layer become darker, and light parts become lighter.

"darken"
Retains the darkest pixels of both layers.

"lighten"
Retains the lightest pixels of both layers.

"color-dodge"
Divides the bottom layer by the inverted top layer.

"color-burn"
Divides the inverted bottom layer by the top layer, and then inverts the result.

"hard-light"
Like overlay, a combination of multiply and screen — but instead with the top layer and bottom layer swapped.

"soft-light"
A softer version of hard-light. Pure black or white does not result in pure black or white.

"difference"
Subtracts the bottom layer from the top layer — or the other way round — to always get a positive value.

"exclusion"
Like difference, but with lower contrast.

"hue"
Preserves the luma and chroma of the bottom layer, while adopting the hue of the top layer.

"saturation"
Preserves the luma and hue of the bottom layer, while adopting the chroma of the top layer.

"color"
Preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.

"luminosity"
Preserves the hue and chroma of the bottom layer, while adopting the luma of the top layer.

*/

export const BLEND_MODES = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
  { value: "xor", label: "XOR" },
  { value: "source-in", label: "Source In" },
  { value: "source-out", label: "Source Out" },
  { value: "source-atop", label: "Source Atop" },
  { value: "destination-over", label: "Destination Over" },
  { value: "destination-in", label: "Destination In" },
  { value: "destination-out", label: "Destination Out" },
  { value: "destination-atop", label: "Destination Atop" },
];

// Type for blend modes
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
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | "xor"
  | "source-in"
  | "source-out"
  | "source-atop"
  | "destination-over"
  | "destination-in"
  | "destination-out"
  | "destination-atop";

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
      options: BLEND_MODES,
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
    {
      id: "resize",
      label: "Resize Options",
      type: "resize",
      group: "position",
    },
    {
      id: "alignment",
      label: "Alignment",
      type: "alignment",
      group: "position",
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
      id: "fontColor",
      label: "Color",
      type: "color",
      group: "text",
    },
    {
      id: "stroke",
      label: "Stroke Color",
      type: "color",
      group: "text",
    },
    {
      id: "strokeWidth",
      label: "Stroke Width",
      type: "number",
      min: 0,
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
      options: BLEND_MODES,
      group: "appearance",
    },
    {
      id: "alignment",
      label: "Alignment",
      type: "alignment",
      group: "position",
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
      options: BLEND_MODES,
      group: "appearance",
    },
    {
      id: "alignment",
      label: "Alignment",
      type: "alignment",
      group: "position",
    },
  ],
};

export const getPropertyValue = (
  objects: EditorObjectBase[],
  propertyId: string
) => {
  const parts = propertyId.split(".");
  let value: Partial<EditorObjectBase> = objects.length > 0 ? objects[0] : {};
  for (const part of parts) {
    value = value[part];
  }
  return value;
};

export const setPropertyValue = (
  object: EditorObjectBase,
  propertyId: string,
  value: string | number | boolean | undefined
): Partial<EditorObjectBase> => {
  const parts = propertyId.split(".");
  const result: Partial<EditorObjectBase> = {};
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...object[parts[i]] };
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
  return result;
};
