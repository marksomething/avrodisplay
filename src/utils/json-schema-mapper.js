let idCounter = 0;

const parseType = (property) => {
  let isNullable = false;
  let typeString;

  if (Array.isArray(property.type)) {
    const nonNullTypes = property.type.filter(t => t !== 'null');
    isNullable = property.type.includes('null');
    typeString = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null && t.type) {
        return t.type;
      }
      return t;
    }).join(' | ');
  } else if (property.type === 'array') {
    if (property.items) {
      const itemType = property.items.type;
      if (typeof property.items === 'object' && property.items !== null && property.items.properties) {
        typeString = `ARRAY[object]`;
      } else {
        typeString = `ARRAY[${itemType}]`;
      }
    } else {
      typeString = 'ARRAY';
    }
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
      const isArrayField = property.type === 'array';

      const baseNode = {
        id: `node-${idCounter++}`,
        name: name + (isArrayField ? '[]' : ''),
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
