import { openDB } from "idb";
import { MediaItem } from "../types/media";

const DB_NAME = "media-library";
const STORE_NAME = "media";

export const mediaDB = () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });

export const saveMedia = async (file: File): Promise<MediaItem> => {
  const db = await mediaDB();

  debugger;
  // Create thumbnail and get image dimensions
  const [thumbnail, dimensions] = await createThumbnail(file);

  const item: MediaItem = {
    id: `media-${Date.now()}`,
    url: URL.createObjectURL(file),
    thumbnail,
    name: file.name,
    createdAt: new Date(),
    size: dimensions,
  };

  debugger;
  await db.put(STORE_NAME, item);

  debugger;
  return item;
};

export const getRecentMedia = async (limit = 10): Promise<MediaItem[]> => {
  const db = await mediaDB();
  const items = await db.getAll(STORE_NAME);
  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};

const createThumbnail = (
  file: File
): Promise<[string, { width: number; height: number }]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    console.log("Creating thumbnail for:", file.name, "size:", file.size);

    // Remove crossOrigin for local files
    // img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        console.log("Image loaded:", img.width, "x", img.height);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Handle large images by scaling down more
        const MAX_SIZE = 100;
        const MAX_DIMENSION = 4096; // Max texture size most browsers support

        // First scale down if image is too large
        let scaledWidth = img.width;
        let scaledHeight = img.height;

        if (scaledWidth > MAX_DIMENSION || scaledHeight > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(scaledWidth, scaledHeight);
          scaledWidth *= scale;
          scaledHeight *= scale;
        }

        // Then scale to thumbnail size
        const scale = Math.min(MAX_SIZE / scaledWidth, MAX_SIZE / scaledHeight);
        canvas.width = scaledWidth * scale;
        canvas.height = scaledHeight * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
        console.log("Thumbnail created successfully");

        resolve([thumbnail, { width: img.width, height: img.height }]);
      } catch (error) {
        console.error("Error creating thumbnail:", error);
        reject(error);
      }
    };

    img.onerror = (error) => {
      console.error("Error loading image:", error);
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
};
