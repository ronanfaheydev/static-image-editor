import React from "react";
import "./ToggleButton.scss";

interface ToggleButtonProps {
  isExpanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  isExpanded,
  onClick,
}) => (
  <button className="toggle-group" onClick={onClick}>
    {isExpanded ? "▼" : "▶"}
  </button>
);
