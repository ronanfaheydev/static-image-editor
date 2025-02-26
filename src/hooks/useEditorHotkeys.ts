import { useHotkeys } from "react-hotkeys-hook";
import { EditorState } from "../types/editor";

interface UseEditorHotkeysProps {
  setEditorState: (state: Partial<EditorState>) => void;
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleBringToFront: () => void;
  handleBringForward: () => void;
  handleSendToBack: () => void;
  handleSendBackward: () => void;
  handleGroup: () => void;
  handleUngroup: () => void;
}

export const useEditorHotkeys = ({
  setEditorState,
  handleCut,
  handleCopy,
  handlePaste,
  handleDelete,
  handleUndo,
  handleRedo,
  handleBringToFront,
  handleBringForward,
  handleSendToBack,
  handleSendBackward,
  handleGroup,
  handleUngroup,
}: UseEditorHotkeysProps) => {
  // Tool selection
  useHotkeys(
    "v",
    () => {
      setEditorState({ tool: "select" });
    },
    []
  );

  useHotkeys(
    "t",
    () => {
      setEditorState({ tool: "text" });
    },
    []
  );

  useHotkeys(
    "r",
    () => {
      setEditorState({ tool: "shape" });
    },
    []
  );

  useHotkeys(
    "i",
    () => {
      setEditorState({ tool: "image" });
    },
    []
  );

  // Clipboard operations
  useHotkeys(
    "cmd+x",
    (e) => {
      e.preventDefault();
      handleCut();
    },
    [handleCut]
  );

  useHotkeys(
    "cmd+c",
    (e) => {
      e.preventDefault();
      handleCopy();
    },
    [handleCopy]
  );

  useHotkeys(
    "cmd+v",
    (e) => {
      e.preventDefault();
      handlePaste();
    },
    [handlePaste]
  );

  // Delete
  useHotkeys(
    "backspace",
    (e) => {
      e.preventDefault();
      handleDelete();
    },
    [handleDelete]
  );

  useHotkeys(
    "delete",
    (e) => {
      e.preventDefault();
      handleDelete();
    },
    [handleDelete]
  );

  // Undo/Redo
  useHotkeys(
    "cmd+z",
    (e) => {
      e.preventDefault();
      handleUndo();
    },
    [handleUndo]
  );

  useHotkeys(
    "cmd+shift+z",
    (e) => {
      e.preventDefault();
      handleRedo();
    },
    [handleRedo]
  );

  // Layer ordering
  useHotkeys(
    "cmd+]",
    (e) => {
      e.preventDefault();
      handleBringToFront();
    },
    [handleBringToFront]
  );

  useHotkeys(
    "cmd+shift+]",
    (e) => {
      e.preventDefault();
      handleBringForward();
    },
    [handleBringForward]
  );

  useHotkeys(
    "cmd+[",
    (e) => {
      e.preventDefault();
      handleSendToBack();
    },
    [handleSendToBack]
  );

  useHotkeys(
    "cmd+shift+[",
    (e) => {
      e.preventDefault();
      handleSendBackward();
    },
    [handleSendBackward]
  );

  // Grouping
  useHotkeys(
    "cmd+g",
    (e) => {
      e.preventDefault();
      handleGroup();
    },
    [handleGroup]
  );

  useHotkeys(
    "cmd+shift+g",
    (e) => {
      e.preventDefault();
      handleUngroup();
    },
    [handleUngroup]
  );
};
