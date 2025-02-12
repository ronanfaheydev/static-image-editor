import { Stage } from "konva/lib/Stage";

export interface ExportOptions {
  format: "png" | "jpeg";
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

export const exportStage = (
  stage: Stage,
  options: ExportOptions = { format: "png", pixelRatio: 2 }
): string => {
  const prevPosition = {
    x: stage.x(),
    y: stage.y(),
    scale: {
      x: stage.scaleX(),
      y: stage.scaleY(),
    },
  };

  // Reset stage position and scale for export
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });

  // Create data URL
  const dataURL = stage.toDataURL({
    mimeType: `image/${options.format}`,
    quality: options.quality || 1,
    pixelRatio: options.pixelRatio || 2,
    backgroundColor: options.backgroundColor,
  });

  // Restore stage position and scale
  stage.scale(prevPosition.scale);
  stage.position({ x: prevPosition.x, y: prevPosition.y });

  return dataURL;
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
