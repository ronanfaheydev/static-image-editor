type DefaultNodeProps<T> = {
  id: string;
  children: T[];
  parentId: string | null;
  type: string;
};

export const findNodeById = <T extends DefaultNodeProps<T>>(
  tree: T[],
  id: string
): T | null => {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNodeById<T>(node.children, id);
    if (found) return found;
  }
  return null;
};

export const findParentNode = <T extends DefaultNodeProps<T>>(
  tree: T[],
  childId: string
): T | null => {
  for (const node of tree) {
    if (node.children.some((child) => child.id === childId)) return node;
    const found = findParentNode(node.children, childId);
    if (found) return found;
  }
  return null;
};

export const removeNodeFromParent = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string
): T[] => {
  return tree.map((node) => ({
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeNodeFromParent([child], nodeId)[0]),
  }));
};

export const insertNode = <T extends DefaultNodeProps<T>>(
  tree: T[],
  newNode: T,
  parentId?: string | null
): T[] => {
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

export const addNodeToParent = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string,
  parentId: string
): T[] => {
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

export const updateNodeInTree = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string,
  updates: Partial<T>
): T[] => {
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

export const moveNodeToIndex = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string,
  targetIndex: number
): T[] => {
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

export const moveNodeToFront = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string
): T[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  return moveNodeToIndex(tree, nodeId, siblings.length - 1);
};

export const moveNodeToBack = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string
): T[] => {
  return moveNodeToIndex(tree, nodeId, 0);
};

export const moveNodeForward = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string
): T[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  const currentIndex = siblings.findIndex((n) => n.id === nodeId);

  if (currentIndex === siblings.length - 1) return tree; // Already at front
  return moveNodeToIndex(tree, nodeId, currentIndex + 1);
};

export const moveNodeBackward = <T extends DefaultNodeProps<T>>(
  tree: T[],
  nodeId: string
): T[] => {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;

  const siblings = tree.filter((obj) => obj.parentId === node.parentId);
  const currentIndex = siblings.findIndex((n) => n.id === nodeId);

  if (currentIndex === 0) return tree; // Already at back
  return moveNodeToIndex(tree, nodeId, currentIndex - 1);
};
