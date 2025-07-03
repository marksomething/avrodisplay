let idCounter = 0;

const parseType = (type) => {
  if (Array.isArray(type)) {
    return type.map(parseType).join(' | ');
  }
  if (typeof type === 'object' && type !== null) {
    return type.type;
  }
  return type;
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const processField = (field) => {
    const baseNode = {
      id: `node-${idCounter++}`,
      name: field.name,
      properties: { Type: parseType(field.type) },
    };

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        baseNode.children = field.type.fields.map(processField);
      } else if (field.type.type === 'array') {
        if (typeof field.type.items === 'object' && field.type.items !== null) {
          baseNode.children = field.type.items.fields.map(processField);
        }
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
