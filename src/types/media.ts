export interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  createdAt: Date;
  size: {
    width: number;
    height: number;
  };
}
