import { TreeNode } from "../types/editor";

export const findNodeById = (tree: TreeNode[], id: string): TreeNode | null => {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
};

export const findParentNode = (
  tree: TreeNode[],
  childId: string
): TreeNode | null => {
  for (const node of tree) {
    if (node.children.some((child) => child.id === childId)) return node;
    const found = findParentNode(node.children, childId);
    if (found) return found;
  }
  return null;
};

export const removeNodeFromParent = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  return tree.map((node) => ({
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeNodeFromParent([child], nodeId)[0]),
  }));
};

export const insertNode = (
  tree: TreeNode[],
  newNode: TreeNode,
  parentId?: string | null
): TreeNode[] => {
  if (parentId) {
    const parentNode = findNodeById(tree, parentId);
    if (!parentNode) return tree;

    return tree.map((currentNode) => {
      if (currentNode.id === parentId) {
        return { ...currentNode, children: [...currentNode.children, newNode] };
      }
      return currentNode.children.length
        ? {
            ...currentNode,
            children: insertNode(currentNode.children, newNode, parentId),
          }
        : currentNode;
    });
  }

  return [...tree, newNode];
};

export const addNodeToParent = (
  tree: TreeNode[],
  nodeId: string,
  parentId: string
): TreeNode[] => {
  const nodeToAdd = findNodeById(tree, nodeId);
  if (!nodeToAdd) return tree;

  return tree.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, nodeToAdd],
      };
    }
    return {
      ...node,
      children: addNodeToParent(node.children, nodeId, parentId),
    };
  });
};

export const updateNodeInTree = (
  tree: TreeNode[],
  nodeId: string,
  updates: Partial<TreeNode>
): TreeNode[] => {
  return tree.map((node) => {
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }
    return {
      ...node,
      children: updateNodeInTree(node.children, nodeId, updates),
    };
  });
};

export const moveNodeToIndex = (
  tree: TreeNode[],
  nodeId: string,
  targetIndex: number
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  // Get all siblings (nodes with same parent)
  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  const otherNodes = tree.filter((obj) => obj.parentId !== node.parentId);

  // Remove node from current position
  const currentIndex = siblings.findIndex((n) => n.id === nodeId);
  if (currentIndex === -1) return tree;

  // Create new array with node at target position
  const reorderedSiblings = [...siblings];
  reorderedSiblings.splice(currentIndex, 1);
  reorderedSiblings.splice(targetIndex, 0, node);

  return [...otherNodes, ...reorderedSiblings];
};

export const moveNodeToFront = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  return moveNodeToIndex(tree, nodeId, siblings.length - 1);
};

export const moveNodeToBack = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  return moveNodeToIndex(tree, nodeId, 0);
};

export const moveNodeForward = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  const currentIndex = siblings.findIndex((n) => n.id === nodeId);

  if (currentIndex === siblings.length - 1) return tree; // Already at front
  return moveNodeToIndex(tree, nodeId, currentIndex + 1);
};

export const moveNodeBackward = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  const currentIndex = siblings.findIndex((n) => n.id === nodeId);

  if (currentIndex === 0) return tree; // Already at back
  return moveNodeToIndex(tree, nodeId, currentIndex - 1);
};
