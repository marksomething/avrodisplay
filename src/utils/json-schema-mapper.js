let idCounter = 0;

const parseType = (property) => {
  const isNullable = property.nullable === true || (Array.isArray(property.type) && property.type.includes('null'));
  let typeString;

  const nonNullTypes = Array.isArray(property.type) ? property.type.filter(t => t !== 'null') : [property.type];

  if (nonNullTypes.length === 1) {
    typeString = nonNullTypes[0];
  } else {
    typeString = nonNullTypes.join(' | ');
  }

  if (typeString === 'array') {
    if (property.items) {
      if (property.items.type) {
        typeString = `array[${property.items.type}]`;
      } else if (property.items.properties) {
        typeString = 'array[object]';
      }
    }
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
        properties: { DataType: parsedType.type, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: property.description || '' },
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
