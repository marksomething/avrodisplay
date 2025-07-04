let idCounter = 0;

const openMetadataToTree = (schema) => {
  if (!schema) return [];

  const processColumn = (column) => {
    const baseNode = {
      id: `node-${idCounter++}`,
      name: column.name,
      properties: { DataType: column.dataType, Nullable: column.nullable ? 'Yes' : 'No', Description: column.description || '' },
    };

    if (column.children && column.dataType === 'STRUCT') {
      baseNode.children = column.children.map(processColumn);
    }

    return baseNode;
  };

  if (schema.columns) {
    return schema.columns.map(processColumn);
  }

  return [];
};

export default openMetadataToTree;
