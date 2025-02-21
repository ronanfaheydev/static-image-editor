import React from "react";
import "./ZoomControl.scss";

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom,
  onZoomChange,
}) => {
  return (
    <div className="zoom-control">
      <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
      />
    </div>
  );
};
