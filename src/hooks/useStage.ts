import { KonvaEventObject } from "konva/lib/Node";
import { Stage } from "konva/lib/Stage";
import { useCallback, useState } from "react";
import { EditorState } from "../types/editor";

export const useStage = ({
  stageRef,
  setEditorState,
  editorState,
}: {
  stageRef: React.RefObject<Stage | null>;
  setEditorState: (state: Partial<EditorState>) => void;
  editorState: EditorState;
}) => {
  // Add state for canvas position
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [, setIsDragging] = useState(false);

  // Wrap handleWheel
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = editorState.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
      const zoom = Math.min(Math.max(newScale, 0.1), 5);

      setEditorState({ zoom });
      setStagePosition({
        x: pointer.x - mousePointTo.x * zoom,
        y: pointer.y - mousePointTo.y * zoom,
      });
    },
    [editorState.zoom, setEditorState, stageRef]
  );

  // Update drag handlers to check if we're dragging the stage
  const handleDragStart = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setIsDragging(true);
    }
  }, []);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setIsDragging(false);
    }
  }, []);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setStagePosition({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  }, []);

  return {
    stagePosition,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  };
};
