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
    } else if (dataType === 'UNION' && column.children) {
      const nonNullTypes = column.children.filter(c => c.dataType !== 'NULL');
      if (nonNullTypes.length > 1) {
        const dataTypeStrings = nonNullTypes.map(t => {
          if (t.name) {
            return t.name;
          }
          if (t.dataType === 'ARRAY') {
            return `ARRAY[${t.arrayDataType}]`;
          }
          return t.dataType;
        });
        dataType = dataTypeStrings.join(' | ');

        children = nonNullTypes.map(unionType => {
          const unionNode = processColumn(unionType);
          unionNode.name = `[${unionNode.name}]`; // Add brackets to union child names
          return unionNode;
        });
      }
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
