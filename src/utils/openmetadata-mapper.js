let idCounter = 0;

const openMetadataToTree = (schema) => {
  if (!schema) return [];

  const processColumn = (column) => {
    let dataType = column.dataType;
    let name = column.name;
    let children = [];

    if (dataType === 'ARRAY') {
      dataType = `ARRAY[${column.arrayDataType}]`;
      name = `${column.name}[]`;
      if (column.arrayDataType === 'STRUCT' && column.children) {
        children = column.children.map(processColumn);
      }
    } else if (dataType === 'STRUCT' && column.children) {
      children = column.children.map(processColumn);
    }

    const baseNode = {
      id: `node-${idCounter++}`,
      name: name,
      properties: { DataType: dataType, Nullable: column.nullable ? 'Yes' : 'No', Description: column.description || '' },
    };

    if (children.length > 0) {
      baseNode.children = children;
    }

    return baseNode;
  };

  if (schema.columns) {
    return schema.columns.map(processColumn);
  }

  return [];
};

export default openMetadataToTree;
