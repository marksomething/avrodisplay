const mergeData = (treeData, additionalData) => {
  if (!treeData || !additionalData) return treeData;

  const generateFqnAndMerge = (nodes, parentFqn = '') => {
    return nodes.map(node => {
      const isUnion = node.name.startsWith('[') & node.name.endsWith(']');
      const currentFieldName = node.name.endsWith('[]') ? node.name : node.name;
      const currentFqn = parentFqn ? isUnion ? `${parentFqn}${currentFieldName}` : `${parentFqn}.${currentFieldName}` : currentFieldName;

      const newNode = { ...node, fqn: currentFqn };

      if (additionalData[currentFqn]) {
        newNode.properties = { ...newNode.properties, ...additionalData[currentFqn] };
      }

      if (newNode.children && newNode.children.length > 0) {
        newNode.children = generateFqnAndMerge(newNode.children, currentFqn);
      }

      return newNode;
    });
  };

  return generateFqnAndMerge(treeData);
};

export default mergeData;