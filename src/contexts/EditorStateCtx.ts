import { createContext } from "react";
import { EditorState } from "../types/editor";

import { DEFAULT_FORMATS, UseFormat } from "../hooks/useFormats";

const EditorStateContext = createContext<{
  editorState: EditorState;
  updateEditorState: (state: Partial<EditorState>) => void;
  format: UseFormat;
}>({
  editorState: {
    selectedIds: [],
    tool: "select",
    zoom: 1,
    formatEditMode: "single",
    backgroundColor: "#ffffff",
    backgroundOpacity: 1,
    selectedLayerId: null,
    isDrawing: false,
    drawStartPosition: null,
    drawPreview: null,
  },

  updateEditorState: () => {},
  format: {
    currentFormat: DEFAULT_FORMATS[0],
    customFormats: [],
    handleCustomFormatAdd: () => {},
    setCurrentFormat: () => {},
    setCustomFormats: () => {},
  },
});

export default EditorStateContext;
