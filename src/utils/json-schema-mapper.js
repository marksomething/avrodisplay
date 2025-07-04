let idCounter = 0;

const parseType = (property) => {
  if (Array.isArray(property.type)) {
    return property.type.join(' | ');
  }
  return property.type;
};

const jsonSchemaToTree = (schema) => {
  if (!schema) return [];

  const processProperties = (properties) => {
    return Object.entries(properties).map(([name, property]) => {
      const baseNode = {
        id: `node-${idCounter++}`,
        name,
        properties: { Type: parseType(property), Description: property.description || '' },
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
