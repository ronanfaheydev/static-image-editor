import React, { useState, useCallback, useEffect } from "react";
import { MediaItem } from "../../types/media";
import { saveMedia, getRecentMedia } from "../../utils/mediaLibrary";
import "./MediaLibraryDialog.scss";

interface MediaLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaItem: MediaItem) => void;
  openDialog: (dialogName: string) => void;
}

export const MediaLibraryDialog: React.FC<MediaLibraryDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const loadRecentMedia = useCallback(async () => {
    const items = await getRecentMedia();
    setRecentMedia(items);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRecentMedia();
    }
  }, [isOpen, loadRecentMedia]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      for (const file of files) {
        await saveMedia(file);
      }
      loadRecentMedia();
    },
    [loadRecentMedia]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        await saveMedia(file);
      }
      loadRecentMedia();
    },
    [loadRecentMedia]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="media-library-modal">
        <div className="modal-header">
          <h2>Image frame content</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <h3>Upload </h3>
        <div
          className={`upload-area ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="file-input"
          />
          <label htmlFor="file-input">
            Drop images here or click to upload
          </label>
        </div>

        <div className="recent-media">
          <h3>Recent Images</h3>
          <div className="media-grid">
            {recentMedia.map((item) => (
              <div
                key={item.id}
                className="media-item"
                onClick={() => onSelect(item)}
              >
                <img src={item.thumbnail} alt={item.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
