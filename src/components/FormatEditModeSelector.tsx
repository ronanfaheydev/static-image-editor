import React from "react";
import { FormatEditMode } from "../types/editor";

interface FormatEditModeSelectorProps {
  mode: FormatEditMode;
  onChange: (mode: FormatEditMode) => void;
}

export const FormatEditModeSelector: React.FC<FormatEditModeSelectorProps> = ({
  mode,
  onChange,
}) => {
  return (
    <div className="format-edit-mode">
      <label>Edit Mode:</label>
      <div className="format-edit-mode-buttons">
        <button
          className={mode === "single" ? "active" : ""}
          onClick={() => onChange("single")}
          title="Edit current format only"
        >
          Single Format
        </button>
        <button
          className={mode === "all" ? "active" : ""}
          onClick={() => onChange("all")}
          title="Edit all formats simultaneously"
        >
          All Formats
        </button>
      </div>
    </div>
  );
};
