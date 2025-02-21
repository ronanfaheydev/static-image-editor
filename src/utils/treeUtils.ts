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
  node: TreeNode,
  parentId?: string | null
): TreeNode[] => {
  if (parentId) {
    const parentNode = findNodeById(tree, parentId);
    if (!parentNode) return tree;

    return tree.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, node] };
      }
      return node;
    });
  }

  return [...tree, node];
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
