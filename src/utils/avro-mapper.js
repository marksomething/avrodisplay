import { generateNodeId, getUnionTypeInfo } from './common-utils';

const parseType = (type) => {
  let isNullable = false;
  let dataType;
  let dataTypeDisplay;

  if (Array.isArray(type)) {
    const unionInfo = getUnionTypeInfo(type, parseType);
    dataType = unionInfo.dataType;
    dataTypeDisplay = unionInfo.dataTypeDisplay;
    isNullable = unionInfo.isNullable;
  } else if (typeof type === 'object' && type !== null) {
    dataType = type.type;
    if (type.type === 'array') {
        const itemTypeResult = parseType(type.items);
        dataTypeDisplay = `array[${itemTypeResult.dataTypeDisplay}]`;
    } else { // record, enum, fixed
      if (type.type === 'record' && type.name) {
        dataTypeDisplay = type.name;
      } else {
        dataTypeDisplay = type.type;
      }
      if (type.logicalType) {
        dataTypeDisplay = `${dataTypeDisplay}:${type.logicalType}`;
      }
    }
  } else { // primitive type
    dataType = type;
    dataTypeDisplay = type;
  }

  return { dataType, dataTypeDisplay, isNullable };
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const createUnionNode = (unionType, baseFqn) => {
    let unionTypeName;
    let unionDataTypeDisplay;
    let unionDataType;
    let unionChildren = [];

    if (typeof unionType === 'object' && unionType !== null) {
      const parsedUnionType = parseType(unionType);
      unionTypeName = unionType.name || unionType.type;
      unionDataTypeDisplay = parsedUnionType.dataTypeDisplay;
      unionDataType = parsedUnionType.dataType;
      if (unionType.type === 'record') {
        unionChildren = unionType.fields.map(f => processField(f, `${baseFqn}[${unionTypeName}]`));
      } else if (unionType.type === 'array' && typeof unionType.items === 'object' && unionType.items !== null && unionType.items.type === 'record') {
        unionChildren = unionType.items.fields.map(f => processField(f, `${baseFqn}[${unionTypeName}]`));
      }
    } else {
      const parsedUnionType = parseType(unionType);
      unionTypeName = unionType;
      unionDataTypeDisplay = parsedUnionType.dataTypeDisplay;
      unionDataType = parsedUnionType.dataType;
    }

    const unionNode = {
      id: generateNodeId(),
      name: `[${unionTypeName}]`,
      dataType: unionDataType,
      dataTypeDisplay: unionDataTypeDisplay,
      constraint: ['NOT_NULL'], // Union branches are inherently non-nullable
      Description: '',
      fqn: `${baseFqn}[${unionTypeName}]`
    };

    if (unionChildren.length > 0) {
      unionNode.children = unionChildren;
    }
    return unionNode;
  };

  const processUnionTypes = (unionTypes, baseFqn) => {
    const nonNullTypes = unionTypes.filter(t => t !== 'null');
    if (nonNullTypes.length > 1) {
      return nonNullTypes.map(unionType => createUnionNode(unionType, baseFqn));
    }
    return [];
  };

  const processField = (field, parentFqn = '') => {
    const parsedType = parseType(field.type);
    let dataTypeDisplay = parsedType.dataTypeDisplay;
    if (field.logicalType && typeof field.type !== 'object') {
      dataTypeDisplay = `${dataTypeDisplay}:${field.logicalType}`;
    }
    const isArrayField = typeof field.type === 'object' && field.type !== null && field.type.type === 'array';

    const currentFieldName = field.name + (isArrayField ? '[]' : '');
    const currentFqn = parentFqn ? `${parentFqn}.${currentFieldName}` : currentFieldName;

    const constraints = [];
    if (field.constraint) {
      constraints.push(field.constraint);
    }
    if (parsedType.isNullable) {
      constraints.push('NULL');
    } else {
      constraints.push('NOT_NULL');
    }

    const baseNode = {
      id: generateNodeId(),
      name: currentFieldName,
      dataType: parsedType.dataType,
      dataTypeDisplay: dataTypeDisplay,
      constraint: constraints,
      Description: field.doc || '',
      fqn: currentFqn,
    };

    let children = [];

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        children = field.type.fields.map(f => processField(f, baseNode.fqn));
      } else if (field.type.type === 'array') {
        if (Array.isArray(field.type.items)) {
            children = processUnionTypes(field.type.items, baseNode.fqn);
            if (children.length === 0 && typeof field.type.items[0] === 'object' && field.type.items[0] !== null && field.type.items[0].type === 'record') {
                children = field.type.items[0].fields.map(f => processField(f, baseNode.fqn));
            }
        } else if (typeof field.type.items === 'object' && field.type.items !== null && field.type.items.type === 'record') {
          children = field.type.items.fields.map(f => processField(f, baseNode.fqn));
        }
      }
    } else if (Array.isArray(field.type)) {
        children = processUnionTypes(field.type, baseNode.fqn);
    }

    if (children.length > 0) {
        baseNode.children = children;
    }

    return baseNode;
  };

  if (schema.type === 'record') {
    return schema.fields.map(f => processField(f, ''));
  }

  return [];
};

export default avroToTree;
