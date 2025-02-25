import React from "react";

import { EditorState, ShapeType } from "../../types/editor";
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
import { DialogKey } from "../../types/project";

interface ToolbarProps {
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastModified?: Date;
  openDialog: (dialogName: DialogKey) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editorState,
  setEditorState,
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

  const handleToolSelect = (
    tool: EditorState["tool"],
    shapeType?: ShapeType
  ) => {
    setEditorState((prev) => ({
      ...prev,
      tool,
      selectedIds: [], // Clear selection when changing tools
      selectedShapeType: shapeType,
    }));
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <h1>Creative 1</h1>
        <h3>Static creative</h3>
        <Speedometer />
      </div>

      <div className="toolbar-main">
        <button
          className={`tool-button ${
            editorState.tool === "select" ? "active" : ""
          }`}
          onClick={() => handleToolSelect("select")}
          title="Select (V)"
        >
          <Select />
        </button>

        <button
          className={`tool-button ${
            editorState.tool === "image" ? "active" : ""
          }`}
          onClick={() => {
            openDialog("mediaLibrary");
          }}
          title="Image (I)"
        >
          <Image />
        </button>

        <div className="dropdown">
          <button
            className={`dropdown-trigger ${
              editorState.tool === "shape" ? "active" : ""
            }`}
            onClick={() => handleToolSelect("shape")}
          >
            <span className="icon">
              <Square />
            </span>
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleToolSelect("shape", "rectangle")}>
              Rectangle
            </button>
            <button onClick={() => handleToolSelect("shape", "circle")}>
              Circle
            </button>
            <button onClick={() => handleToolSelect("shape", "star")}>
              Star
            </button>
            <button onClick={() => handleToolSelect("shape", "line")}>
              Line
            </button>
            <button onClick={() => handleToolSelect("shape", "curve")}>
              Curve
            </button>
          </div>
        </div>

        <button
          className={`tool-button ${
            editorState.tool === "text" ? "active" : ""
          }`}
          onClick={() => handleToolSelect("text")}
          title="Text (T)"
        >
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
          <button
            className="tool-button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            <Undo />
          </button>
          <button
            className="tool-button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
          >
            <Redo />
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
