import { ROOT_ID } from "../constants";
import { ContainerSize } from "../hooks/useContainerSize";
import { GroupObject, ImageObject } from "../types/editor";
import { Format } from "../types/format";
import { MediaItem } from "../types/media";

export const createNewImageFromMediaItem = (
  mediaItem: MediaItem,
  containerSize: ContainerSize,
  currentFormat: Format,
  zIndex: number,
  parentId: string
): ImageObject => {
  const centerX =
    (containerSize.width - currentFormat.width) / 2 + currentFormat.width / 2;
  const centerY =
    (containerSize.height - currentFormat.height) / 2 +
    currentFormat.height / 2;

  const scaleSize = (format: Format, width: number, height: number) => {
    const w = Math.max(width, format.width);
    const h = w * (height / width);
    return {
      width: w,
      height: h,
    };
  };
  return {
    id: `image-${Date.now()}`,
    type: "image",
    src: mediaItem.url,
    position: { x: centerX + 100, y: centerY + 100 },
    size: scaleSize(currentFormat, mediaItem.size.width, mediaItem.size.height),
    rotation: 0,
    opacity: 1,
    visible: true,
    name: mediaItem.name,
    zIndex,
    blendMode: "normal",
    parentId,
    children: [],
    isExpanded: false,
  };
};
export const createGroupObject = ({
  zIndex,
  parentId,
}: {
  zIndex: number;
  parentId?: string;
}): GroupObject => {
  return {
    id: `group-${Date.now()}`,
    type: "group",
    name: "New Group",
    visible: true,
    zIndex,
    children: [],
    isExpanded: true,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    parentId: parentId || ROOT_ID,
    rotation: 0,
    opacity: 1,
  };
};
