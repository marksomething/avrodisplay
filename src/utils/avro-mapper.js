let idCounter = 0;

const parseType = (type) => {
  let isNullable = false;
  let typeString;

  if (Array.isArray(type)) {
    const nonNullTypes = type.filter(t => t !== 'null');
    isNullable = type.includes('null');
    typeString = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null) {
        return parseType(t).type;
      }
      return t;
    }).join(' | ');
  } else if (typeof type === 'object' && type !== null) {
    if (type.type === 'array') {
      const itemTypeResult = parseType(type.items);
      typeString = `ARRAY[${itemTypeResult.type}]`;
    } else {
      typeString = type.type;
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
    const isArrayField = typeof field.type === 'object' && field.type !== null && field.type.type === 'array';

    const baseNode = {
      id: `node-${idCounter++}`,
      name: field.name + (isArrayField ? '[]' : ''),
      properties: { Type: parsedType.type, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: field.doc || '' },
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
