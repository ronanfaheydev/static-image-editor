import { useCallback } from "react";
import { findNodeById, insertNode, updateNodeInTree } from "../utils/treeUtils";
import { EditorObjectBase, TreeNode, TreeNodeType } from "../types/editor";
import { useEditorState } from "./useEditorState";
import { ROOT_ID } from "../constants";

export const useObjectHelpers = ({
  objects,
  setObjects,
}: {
  objects: TreeNode[];
  setObjects: (
    newPresent: TreeNode[] | ((currentPresent: TreeNode[]) => TreeNode[])
  ) => void;
}) => {
  const { updateEditorState, editorState } = useEditorState();

  const isInGroup = useCallback(
    (node: TreeNode): boolean => {
      if (node.type === "root") return false;
      if (!node.parentId) return false;
      const parent = findNodeById(objects, node.parentId) as TreeNode;
      if (parent.type === "group") return true;
      return false;
    },
    [objects]
  );

  // Handle object selection
  const selectObject = useCallback(
    (id: string | null, multiSelect: boolean) => {
      let _id = id;

      const selectedObject = id ? findNodeById<TreeNode>(objects, id) : null;
      const isLayer = selectedObject?.type === "layer";
      const isGroup = selectedObject ? isInGroup(selectedObject) : false;

      if (isGroup) {
        _id = selectedObject?.parentId || null;
      }
      const update = {
        selectedIds: _id
          ? multiSelect
            ? editorState.selectedIds.includes(_id)
              ? editorState.selectedIds.filter((i) => i !== _id)
              : [...editorState.selectedIds, _id]
            : [_id]
          : [],
        selectedLayerId: isLayer ? _id : editorState.selectedLayerId,
      };
      updateEditorState(update);
    },
    [
      objects,
      updateEditorState,
      isInGroup,
      editorState.selectedIds,
      editorState.selectedLayerId,
    ]
  );

  // Update handleAddObject to respect selected layer
  const addObject = useCallback(
    (object: Partial<EditorObjectBase>) => {
      const newObject: EditorObjectBase = {
        ...object,
        id: `${object.type}-${Date.now()}`,
        parentId: editorState.selectedLayerId || ROOT_ID, // Add to selected layer if one is selected
        zIndex: Math.max(...objects.map((obj) => obj.zIndex), 0) + 1,
        isExpanded: false,
        visible: true,
        name: object.name || `${object.type}-${objects.length + 1}`,
        children: [],
        position: object.position || { x: 0, y: 0 },
        size: object.size || { width: 0, height: 0 },
        rotation: object.rotation || 0,
        opacity: object.opacity || 1,
        type: object.type as TreeNodeType,
        blendMode: object.blendMode || "normal",
      };

      const updatedObjects = insertNode(objects, newObject, newObject.parentId);

      setObjects(updatedObjects);
    },
    [objects, editorState.selectedLayerId, setObjects]
  );

  // Handle object changes
  const updateObject = useCallback(
    (id: string, changes: Partial<EditorObjectBase>) => {
      setObjects((prev) => updateNodeInTree(prev, id, changes));
    },
    [setObjects]
  );

  const updateObjectName = useCallback(
    (id: string, name: string) => {
      updateObject(id, { name });
    },
    [updateObject]
  );

  return {
    addObject,
    isInGroup,
    selectObject,
    updateObject,
    updateObjectName,
  };
};
