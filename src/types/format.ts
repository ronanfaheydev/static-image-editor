export interface Format {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const DEFAULT_FORMATS: Format[] = [
  {
    id: "instagram-post",
    name: "Instagram Post",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    width: 1200,
    height: 630,
    aspectRatio: "16:9",
  },
  {
    id: "twitter-post",
    name: "Twitter Post",
    width: 1200,
    height: 675,
    aspectRatio: "16:9",
  },
];
