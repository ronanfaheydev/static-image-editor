import { useCallback, useState } from "react";
import { Format } from "../types/format";

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

export type UseFormat = {
  currentFormat: Format;
  customFormats: Format[];
  handleCustomFormatAdd: (format: Format) => void;
  setCurrentFormat: (format: Format) => void;
  setCustomFormats: (formats: Format[]) => void;
};

export const useFormats = (): UseFormat => {
  // Add format state
  const [currentFormat, setCurrentFormat] = useState<Format>(
    DEFAULT_FORMATS[0]
  );

  const [customFormats, setCustomFormats] = useState<Format[]>([]);

  // Handle custom format add
  const handleCustomFormatAdd = useCallback((format: Format) => {
    setCustomFormats((prev) => [...prev, format]);
  }, []);

  const handleSetCurrentFormat = useCallback((format: Format) => {
    setCurrentFormat(format);
  }, []);

  return {
    currentFormat,
    customFormats,
    handleCustomFormatAdd,
    setCurrentFormat: handleSetCurrentFormat,
    setCustomFormats,
  };
};
