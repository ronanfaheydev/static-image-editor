import React from "react";
import "./LayerName.scss";

interface LayerNameProps {
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (e: React.MouseEvent) => void;
}

export const LayerName: React.FC<LayerNameProps> = ({
  name,
  onChange,
  onClick,
}) => (
  <input
    className="layer-name"
    value={name}
    onChange={onChange}
    onClick={onClick}
  />
);
