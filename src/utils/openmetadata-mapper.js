import { generateNodeId } from './common-utils';

let structCounter = 0;

const openMetadataToTree = (schema) => {
  if (!schema) return [];

  structCounter = 0; // Reset for each new schema processing

  const createUnionColumnNode = (unionType) => {
    const unionNode = processColumn(unionType);
    // For union children, always wrap the name in brackets
    unionNode.name = `[${unionNode.name}]`;
    // Union branches are inherently non-nullable in OpenMetadata structure
    unionNode.constraint = ['NOT_NULL'];
    return unionNode;
  };

  const processUnionColumns = (unionColumns) => {
    const nonNullTypes = unionColumns.filter(c => c.dataType !== 'NULL');
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
      const dataTypeDisplay = dataTypeStrings.join(' | ');

      const children = nonNullTypes.map(unionType => createUnionColumnNode(unionType));
      return { dataTypeDisplay, children };
    }
    return { dataTypeDisplay: '', children: [] };
  };

  const processColumn = (column) => {
    let dataType = column.dataType;
    let dataTypeDisplay = column.dataType;
    let name;
    let children = [];

    // Determine the name for the current node
    if (column.dataType === 'STRUCT') {
        if (column.name) {
            name = column.name;
        } else {
            // Assign a generated name for anonymous structs
            name = `STRUCT_${++structCounter}`;
        }
    } else if (column.dataType === 'ARRAY') {
        name = column.name;
    } else if (column.name) {
        name = column.name;
    } else {
        name = column.dataType;
    }

    let isNullable = column.nullable || false;
    if (dataType === 'UNION' && column.children) {
      const hasNullChild = column.children.some(c => c.dataType === 'NULL');
      isNullable = isNullable || hasNullChild;
    }

    if (dataType === 'ARRAY') {
      dataTypeDisplay = `ARRAY[${column.arrayDataType}]`;
      name = `${column.name}[]`;
      if (column.arrayDataType === 'STRUCT' && column.children) {
        children = column.children.map(processColumn);
      }
    } else if (dataType === 'STRUCT' && column.children) {
      children = column.children.map(processColumn);
    } else if (dataType === 'UNION' && column.children) {
      const unionResult = processUnionColumns(column.children);
      dataTypeDisplay = unionResult.dataTypeDisplay;
      children = unionResult.children;
    }

    const constraints = [];
    if (column.constraint) {
      constraints.push(column.constraint);
    }
    if (isNullable) {
      constraints.push('NULL');
    } else {
      constraints.push('NOT_NULL');
    }

    const baseNode = {
      id: generateNodeId(),
      name: name,
      dataType: dataType,
      dataTypeDisplay: dataTypeDisplay,
      constraint: constraints,
      Description: column.description || '',
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
