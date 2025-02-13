import React from "react";
import { MediaItem } from "../../types/media";
import { deleteMediaItem, getRecentMedia } from "../../utils/mediaLibrary";
import "./MediaLibrary.scss";

interface MediaLibraryProps {
  onSelect: (mediaItem: MediaItem) => void;
  onClose: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  onClose,
}) => {
  const [recentMedia, setRecentMedia] = React.useState<MediaItem[]>([]);

  React.useEffect(() => {
    loadRecentMedia();
  }, []);

  const loadRecentMedia = async () => {
    const media = await getRecentMedia();
    setRecentMedia(media);
  };

  const handleDelete = async (id: string) => {
    await deleteMediaItem(id);
    await loadRecentMedia();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const mediaItem: MediaItem = {
          id: `media-${Date.now()}`,
          name: file.name,
          url: event.target?.result as string,
          type: file.type,
          dateAdded: new Date(),
        };
        onSelect(mediaItem);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="media-library">
      <div className="media-header">
        <h2>Media Library</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          id="media-upload"
        />
        <label htmlFor="media-upload" className="upload-button">
          Upload Image
        </label>
      </div>

      <div className="recent-media">
        <h3>Recent Images</h3>
        <div className="media-grid">
          {recentMedia.map((item) => (
            <div key={item.id} className="media-item">
              <img
                src={item.url}
                alt={item.name}
                onClick={() => onSelect(item)}
              />
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
