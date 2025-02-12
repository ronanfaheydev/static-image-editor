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

  await db.put(STORE_NAME, item);
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
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const MAX_SIZE = 100;
      const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve([
        canvas.toDataURL("image/jpeg", 0.7),
        { width: img.width, height: img.height },
      ]);
    };
    img.src = URL.createObjectURL(file);
  });
};
