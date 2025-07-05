let idCounter = 0;

const parseType = (type) => {
  let isNullable = false;
  let typeString;

  if (Array.isArray(type)) {
    const nonNullTypes = type.filter(t => t !== 'null');
    isNullable = type.includes('null');
    typeString = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null) {
        const innerTypeResult = parseType(t);
        return innerTypeResult.type;
      }
      return t;
    }).join(' | ');
  } else if (typeof type === 'object' && type !== null) {
    if (type.type === 'array') {
        const itemTypeResult = parseType(type.items);
        typeString = `array[${itemTypeResult.type}]`;
    } else {
      if (type.type === 'record' && type.name) {
        typeString = type.name;
      } else {
        typeString = type.type;
      }
      if (type.logicalType) {
        typeString = `${typeString}:${type.logicalType}`;
      }
    }
  } else {
    typeString = type;
  }

  return { type: typeString, isNullable };
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const processField = (field) => {
    const parsedType = parseType(field.type);
    let dataType = parsedType.type;
    if (field.logicalType && typeof field.type !== 'object') { // Apply logicalType only for primitive types directly on the field
      dataType = `${dataType}:${field.logicalType}`;
    }
    const isArrayField = typeof field.type === 'object' && field.type !== null && field.type.type === 'array';

    const baseNode = {
      id: `node-${idCounter++}`,
      name: field.name + (isArrayField ? '[]' : ''),
      properties: { DataType: dataType, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: field.doc || '' },
    };

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        baseNode.children = field.type.fields.map(processField);
      } else if (field.type.type === 'array') {
        if (typeof field.type.items === 'object' && field.type.items !== null && field.type.items.type === 'record') {
          baseNode.children = field.type.items.fields.map(processField);
        }
      }
    } else if (Array.isArray(field.type)) {
        const recordType = field.type.find(t => typeof t === 'object' && t.type === 'record');
        if (recordType) {
            baseNode.children = recordType.fields.map(processField);
        }
    }

    return baseNode;
  };

  if (schema.type === 'record') {
    return schema.fields.map(processField);
  }

  return [];
};

export default avroToTree;
