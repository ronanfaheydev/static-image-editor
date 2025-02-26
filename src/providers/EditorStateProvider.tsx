import { useState } from "react";
import EditorStateContext from "../contexts/EditorStateCtx";
import { EditorState } from "../types/editor";
import { useFormats } from "../hooks/useFormats";

export const EditorStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedIds: [],
    tool: "select",
    zoom: 1, //getInitialZoom(containerSize, currentFormat),
    formatEditMode: "single",
    backgroundColor: "#ffffff",
    backgroundOpacity: 1,
    selectedLayerId: null,
    isDrawing: false,
    drawStartPosition: null,
    drawPreview: null,
  });

  const { currentFormat, ...formats } = useFormats();

  const updateEditorState = (update: Partial<EditorState>) => {
    setEditorState((prev) => ({
      ...prev,
      ...update,
    }));
  };

  const value = {
    editorState,
    updateEditorState,
    format: {
      ...formats,
      currentFormat,
    },
  };

  return (
    <EditorStateContext.Provider value={value}>
      {children}
    </EditorStateContext.Provider>
  );
};
