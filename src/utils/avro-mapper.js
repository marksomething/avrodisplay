let idCounter = 0;

const parseType = (type) => {
  if (Array.isArray(type)) {
    const nonNullTypes = type.filter(t => t !== 'null');
    const isNullable = type.includes('null');
    return {
      type: nonNullTypes.map(t => {
        const result = parseType(t);
        return result.type;
      }).join(' | '),
      isNullable
    };
  }
  if (typeof type === 'object' && type !== null) {
    return { type: type.type, isNullable: false };
  }
  return { type, isNullable: false };
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const processField = (field) => {
    const parsedType = parseType(field.type);
    const baseNode = {
      id: `node-${idCounter++}`,
      name: field.name,
      properties: { Type: parsedType.type, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: field.doc || '' },
    };

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        baseNode.children = field.type.fields.map(processField);
      } else if (field.type.type === 'array') {
        if (typeof field.type.items === 'object' && field.type.items !== null) {
          baseNode.children = field.type.items.fields.map(processField);
        }
      }
    } else if (Array.isArray(field.type)) {
        // Handle nested types within unions if necessary, though Avro unions are usually flat
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
