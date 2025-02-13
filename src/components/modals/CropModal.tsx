import React, { useCallback, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import "./CropModal.scss";

interface CropModalProps {
  src: string;
  onClose: () => void;
  onCrop: (croppedImageUrl: string) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  src,
  onClose,
  onCrop,
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const handleCrop = useCallback(() => {
    if (!imageRef) return;

    const canvas = document.createElement("canvas");
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      imageRef,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedImageUrl = canvas.toDataURL("image/png");
    onCrop(croppedImageUrl);
    onClose();
  }, [crop, imageRef, onCrop, onClose]);

  return (
    <div className="crop-modal">
      <div className="crop-modal-content">
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
          <img src={src} alt="Crop" ref={(img) => setImageRef(img)} />
        </ReactCrop>
        <div className="crop-modal-actions">
          <button onClick={handleCrop}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
