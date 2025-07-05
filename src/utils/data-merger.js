const mergeData = (treeData, additionalData) => {
  if (!treeData || !additionalData) return treeData;

  const traverseAndMerge = (nodes) => {
    return nodes.map(node => {
      const fqn = node.fqn;

      const newNode = { ...node };

      if (additionalData[fqn]) {
        newNode.properties = { ...newNode.properties, ...additionalData[fqn] };
      }

      if (newNode.children && newNode.children.length > 0) {
        newNode.children = traverseAndMerge(newNode.children);
      }

      return newNode;
    });
  };

  return traverseAndMerge(treeData);
};

export default mergeData;
