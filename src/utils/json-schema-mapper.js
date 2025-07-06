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
      if (property.oneOf) {
        const { oneOf, description } = property;
        const isNullable = oneOf.some(t => t.type === 'null');
        const nonNullTypes = oneOf.filter(t => t.type !== 'null');

        const dataTypeStrings = nonNullTypes.map(t => {
          if (t.title) {
            return t.title;
          }
          if (t.type === 'object') {
            return 'object';
          }
          if (t.type === 'array' && t.items && t.items.type) {
            return `array[${t.items.type}]`;
          }
          if (t.type === 'array' && t.items && t.items.properties) {
            return 'array[object]';
          }
          return t.type;
        });
        const uniqueDataTypeStrings = [...new Set(dataTypeStrings)];
        const dataTypeString = uniqueDataTypeStrings.join(' | ');

        const baseNode = {
          id: `node-${idCounter++}`,
          name: name,
          properties: {
            DataType: dataTypeString,
            Nullable: isNullable ? 'Yes' : 'No',
            Description: description || ''
          },
        };

        const children = nonNullTypes.map(unionType => {
          let typeName;
          let childDataType;

          if (unionType.type === 'object') {
            typeName = unionType.title || 'object';
            childDataType = typeName;
          } else if (unionType.title) {
            typeName = unionType.title;
            childDataType = unionType.title;
          } else if (unionType.type === 'array' && unionType.items) {
            if (unionType.items.type) {
              typeName = `array[${unionType.items.type}]`;
              childDataType = typeName;
            } else if (unionType.items.properties) {
              typeName = 'array[object]';
              childDataType = typeName;
            } else {
              typeName = 'array';
              childDataType = 'array';
            }
          } else {
            typeName = unionType.type;
            childDataType = typeName;
          }

          const childNode = {
            id: `node-${idCounter++}`,
            name: `[${typeName}]`,
            properties: { DataType: childDataType, Nullable: 'No', Description: unionType.description || '' },
          };

          if (unionType.type === 'object' && unionType.properties) {
            childNode.children = processProperties(unionType.properties);
          } else if (unionType.type === 'array' && unionType.items && unionType.items.properties) {
            childNode.children = processProperties(unionType.items.properties);
          }
          return childNode;
        });

        baseNode.children = children;

        return baseNode;
      }

      // Fallback to original logic for non-oneOf properties
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