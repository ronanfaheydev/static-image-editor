import React from "react";

import { EditorState, ShapeObject } from "../../types/editor";
import Bell from "../../assets/icons/bell.svg";
import Save from "../../assets/icons/download.svg";
import Layout from "../../assets/icons/layout.svg";
import Undo from "../../assets/icons/undo.svg";
import Redo from "../../assets/icons/redo.svg";
import Image from "../../assets/icons/image-2.svg";
import Square from "../../assets/icons/square.svg";
import Text from "../../assets/icons/text.svg";
import Speedometer from "../../assets/icons/speedometer.svg";
import Select from "../../assets/icons/select.svg";

import "./Toolbar.scss";

interface ToolbarProps {
  editorState: EditorState;
  setEditorState: (
    state: EditorState | ((prev: EditorState) => EditorState)
  ) => void;
  handleAddText: () => void;
  handleAddShape: (shapeType: ShapeObject["shapeType"]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastModified?: Date;
  openDialog: (dialogName: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  handleAddText,
  handleAddShape,
  handleImageUpload,
  undo,
  redo,
  canUndo,
  canRedo,
  lastModified,
  openDialog,
}) => {
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <h1>Creative 1</h1>
        <h3>Static creative</h3>
        <Speedometer />
      </div>

      <div className="toolbar-main">
        <button>
          <Select />
        </button>
        <div className="dropdown">
          <button className="dropdown-trigger">
            <span className="icon">
              <Image />
            </span>
          </button>
          <div className="dropdown-content">
            <button onClick={() => openDialog("mediaLibrary")}>
              <Image />
            </button>
          </div>
        </div>

        <div className="dropdown">
          <button className="dropdown-trigger">
            <span className="icon">
              <Square />
            </span>
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleAddShape("rectangle")}>
              Rectangle
            </button>
            <button onClick={() => handleAddShape("circle")}>Circle</button>
            <button onClick={() => handleAddShape("star")}>Star</button>
            <button onClick={() => handleAddShape("line")}>Line</button>
            <button onClick={() => handleAddShape("curve")}>Curve</button>
          </div>
        </div>

        <button onClick={handleAddText}>
          <span className="icon">
            <Text />
          </span>
        </button>
      </div>

      <div className="toolbar-right">
        <div className="toolbar-time">
          Last modified: {formatTime(lastModified)}
        </div>

        <div className="toolbar-history">
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <span className="icon">
              <Undo />
            </span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <span className="icon">
              <Redo />
            </span>
          </button>
        </div>

        <div className="toolbar-actions">
          <button
            className="icon-button"
            title="Layout"
            onClick={() => openDialog("templateBrowser")}
          >
            <span className="icon">
              <Layout />
            </span>
          </button>
          <button
            className="icon-button"
            title="Save"
            onClick={() => openDialog("save")}
          >
            <span className="icon">
              <Save />
            </span>
          </button>
          <button className="icon-button" title="Review">
            <span className="">Review</span>
          </button>
        </div>

        <div className="toolbar-notifications">
          <button className="icon-button" title="Notifications">
            <span className="icon">
              <Bell />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
