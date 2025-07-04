const buildFullyQualifiedName = (node, parentFqn = '') => {
  let currentFqn = parentFqn ? `${parentFqn}.${node.name}` : node.name;

  // Handle array notation for the current node if its name ends with '[]'
  if (node.name.endsWith('[]')) {
    currentFqn = currentFqn.replace(/\.\[\]$/, '[]'); // Replace .[] with [] if it's at the end
  }

  return currentFqn;
};

const mergeData = (treeData, additionalData) => {
  if (!treeData || !additionalData) return treeData;

  const traverseAndMerge = (nodes, parentFqn = '') => {
    return nodes.map(node => {
      const fqn = buildFullyQualifiedName(node, parentFqn);

      const newNode = { ...node };

      if (additionalData[fqn]) {
        newNode.properties = { ...newNode.properties, ...additionalData[fqn] };
      }

      if (newNode.children && newNode.children.length > 0) {
        newNode.children = traverseAndMerge(newNode.children, fqn);
      }

      return newNode;
    });
  };

  return traverseAndMerge(treeData);
};

export default mergeData;
