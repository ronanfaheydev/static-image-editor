import React from "react";
import "./AlignmentOptions.scss";

interface AlignmentOptionsProps {
  onAlign: (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => void;
}

export const AlignmentOptions: React.FC<AlignmentOptionsProps> = ({
  onAlign,
}) => {
  return (
    <div className="alignment-options">
      <div className="alignment-row">
        <button onClick={() => onAlign("left")} title="Align Left">
          <span className="align-icon align-left">⫷</span>
        </button>
        <button onClick={() => onAlign("center")} title="Align Center">
          <span className="align-icon align-center">⟺</span>
        </button>
        <button onClick={() => onAlign("right")} title="Align Right">
          <span className="align-icon align-right">⫸</span>
        </button>
      </div>
      <div className="alignment-row">
        <button onClick={() => onAlign("top")} title="Align Top">
          <span className="align-icon align-top">⫯</span>
        </button>
        <button onClick={() => onAlign("middle")} title="Align Middle">
          <span className="align-icon align-middle">⟷</span>
        </button>
        <button onClick={() => onAlign("bottom")} title="Align Bottom">
          <span className="align-icon align-bottom">⫰</span>
        </button>
      </div>
    </div>
  );
};
