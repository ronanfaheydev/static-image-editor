export interface Format {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const DEFAULT_FORMATS: Format[] = [
  {
    id: "instagram-post",
    name: "Instagram Post",
    width: 1080,
    height: 1080,
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    width: 1080,
    height: 1920,
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    width: 1200,
    height: 630,
  },
  {
    id: "twitter-post",
    name: "Twitter Post",
    width: 1200,
    height: 675,
  },
];
