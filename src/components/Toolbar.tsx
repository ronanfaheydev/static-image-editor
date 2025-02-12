import React from "react";
import { EditorState, ShapeObject } from "../types/editor";
import { Format } from "../types/format";
import { FormatSelector } from "./FormatSelector";
import { FormatEditModeSelector } from "./FormatEditModeSelector";

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
  currentFormat: Format;
  handleFormatChange: (format: Format) => void;
  handleCustomFormatAdd: (format: Format) => void;
  handleFormatEditModeChange: (mode: string) => void;
  openDialog: (dialogName: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editorState,
  setEditorState,
  handleAddText,
  handleAddShape,
  handleImageUpload,
  undo,
  redo,
  canUndo,
  canRedo,
  currentFormat,
  handleFormatChange,
  handleCustomFormatAdd,
  handleFormatEditModeChange,
  openDialog,
}) => (
  <div className="toolbar">
    <button
      className={editorState.tool === "select" ? "active" : ""}
      onClick={() => setEditorState((prev) => ({ ...prev, tool: "select" }))}
    >
      Select
    </button>
    <button
      className={editorState.tool === "image" ? "active" : ""}
      onClick={() => setEditorState((prev) => ({ ...prev, tool: "image" }))}
    >
      Image
    </button>
    <button
      className={editorState.tool === "text" ? "active" : ""}
      onClick={() => setEditorState((prev) => ({ ...prev, tool: "text" }))}
    >
      Text
    </button>
    <button
      className={editorState.tool === "shape" ? "active" : ""}
      onClick={() => setEditorState((prev) => ({ ...prev, tool: "shape" }))}
    >
      Shape
    </button>
    <div className="zoom-controls">
      <button
        onClick={() =>
          setEditorState((prev) => ({ ...prev, zoom: prev.zoom * 1.1 }))
        }
      >
        Zoom In
      </button>
      <button
        onClick={() =>
          setEditorState((prev) => ({ ...prev, zoom: prev.zoom / 1.1 }))
        }
      >
        Zoom Out
      </button>
    </div>
    <input
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      id="image-upload"
      onChange={handleImageUpload}
    />
    <label htmlFor="image-upload">
      <button
        className={editorState.tool === "image" ? "active" : ""}
        onClick={() => document.getElementById("image-upload")?.click()}
      >
        Upload Image
      </button>
    </label>
    <button
      className={editorState.tool === "text" ? "active" : ""}
      onClick={handleAddText}
    >
      Add Text
    </button>
    <div className="shape-controls">
      <button onClick={() => handleAddShape("rectangle")}>Rectangle</button>
      <button onClick={() => handleAddShape("circle")}>Circle</button>
      <button onClick={() => handleAddShape("star")}>Star</button>
      <button onClick={() => handleAddShape("line")}>Line</button>
    </div>
    <div className="history-controls">
      <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </button>
    </div>
    <FormatSelector
      currentFormat={currentFormat}
      onFormatChange={handleFormatChange}
      onCustomFormatAdd={handleCustomFormatAdd}
    />
    <FormatEditModeSelector
      mode={editorState.formatEditMode}
      onChange={handleFormatEditModeChange}
    />
    <button onClick={() => openDialog("preview")}>Preview All</button>
    <button onClick={() => openDialog("export")}>Export</button>
    <div className="file-controls">
      <button onClick={() => openDialog("save")}>Save</button>
      <button onClick={() => openDialog("load")}>Load</button>
      <button onClick={() => openDialog("exportJSON")}>Export JSON</button>
    </div>
    <div className="template-controls">
      <button onClick={() => openDialog("templateBrowser")}>
        Browse Templates
      </button>
      <button onClick={() => openDialog("saveTemplate")}>
        Save as Template
      </button>
    </div>
  </div>
);
