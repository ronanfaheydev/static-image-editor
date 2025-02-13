import { openDB } from "idb";
import { MediaItem } from "../types/media";

const DB_NAME = "mediaLibrary";
const STORE_NAME = "media";

const openMediaDB = () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });
};

export const saveMediaItem = async (item: MediaItem) => {
  const db = await openMediaDB();
  await db.put(STORE_NAME, item);
  return item;
};

// Create thumbnail
const createThumbnailFromFile = async (
  file: File
): Promise<[string, { width: number; height: number }]> => {
  const img = new Image();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        const MAX_THUMB_SIZE = 200;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Calculate thumbnail dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_THUMB_SIZE) {
            height = height * (MAX_THUMB_SIZE / width);
            width = MAX_THUMB_SIZE;
          }
        } else {
          if (height > MAX_THUMB_SIZE) {
            width = width * (MAX_THUMB_SIZE / height);
            height = MAX_THUMB_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve([
          canvas.toDataURL("image/png", 0.7),
          { width: img.width, height: img.height },
        ]);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const saveMedia = async (file: File) => {
  // Create a promise to handle file reading
  const fileReader = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Generate thumbnail and get file data
  const [thumbnail, dimensions] = await createThumbnailFromFile(file);
  const fileData = await fileReader;

  // Create media item
  const mediaItem: MediaItem = {
    id: `media-${Date.now()}`,
    name: file.name,
    url: fileData,
    thumbnail,
    type: file.type,
    dateAdded: new Date(),
    width: dimensions.width,
    height: dimensions.height,
    size: file.size,
  };

  return await saveMediaItem(mediaItem);
};

export const getRecentMedia = async (): Promise<MediaItem[]> => {
  const db = await openMediaDB();
  const items = await db.getAll(STORE_NAME);
  return items.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
};

export const deleteMediaItem = async (id: string) => {
  const db = await openMediaDB();
  await db.delete(STORE_NAME, id);
};
