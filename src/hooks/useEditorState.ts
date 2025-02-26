import { useContext } from "react";

import EditorStateContext from "../contexts/EditorStateCtx";

export const useEditorState = () => {
  return useContext(EditorStateContext);
};
