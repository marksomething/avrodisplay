let idCounter = 0;

const parseType = (property) => {
  let isNullable = false;
  let typeString;

  if (Array.isArray(property.type)) {
    const nonNullTypes = property.type.filter(t => t !== 'null');
    isNullable = property.type.includes('null');
    typeString = nonNullTypes.join(' | ');
  } else {
    typeString = property.type;
  }

  if (property.nullable === true) {
    isNullable = true;
  }

  return { type: typeString, isNullable };
};

const jsonSchemaToTree = (schema) => {
  if (!schema) return [];

  const processProperties = (properties) => {
    return Object.entries(properties).map(([name, property]) => {
      const parsedType = parseType(property);
      const baseNode = {
        id: `node-${idCounter++}`,
        name,
        properties: { Type: parsedType.type, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: property.description || '' },
      };

      if (property.type === 'object' && property.properties) {
        baseNode.children = processProperties(property.properties);
      } else if (property.type === 'array' && property.items && property.items.properties) {
        baseNode.children = processProperties(property.items.properties);
      }

      return baseNode;
    });
  };

  if (schema.properties) {
    return processProperties(schema.properties);
  }

  return [];
};

export default jsonSchemaToTree;
