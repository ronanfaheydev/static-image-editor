import React from "react";
import "./VisibilityToggle.scss";

interface VisibilityToggleProps {
  visible: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  visible,
  onClick,
}) => (
  <button
    className={`visibility-toggle ${visible ? "visible" : ""}`}
    onClick={onClick}
  >
    {visible ? (
      <span className="visible-icon" />
    ) : (
      <span className="hidden-icon" />
    )}
  </button>
);
