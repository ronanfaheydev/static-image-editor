import React from "react";
import "./DeleteButton.scss";

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick }) => (
  <button className="delete-button" onClick={onClick}>
    ×
  </button>
);
