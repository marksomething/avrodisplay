import { generateNodeId, getUnionTypeInfo } from './common-utils';

const parseType = (property) => {
    const isNullable = property.nullable === true || (Array.isArray(property.type) && property.type.includes('null'));
    const nonNullTypes = Array.isArray(property.type) ? property.type.filter(t => t !== 'null') : [property.type];

    let rawType;
    let formattedType;

    if (nonNullTypes.length > 1) {
        const unionInfo = getUnionTypeInfo(property.type, parseType);
        rawType = unionInfo.rawType;
        formattedType = unionInfo.formattedType;
    } else {
        rawType = nonNullTypes[0];
        formattedType = rawType;
    }

    if (rawType === 'array') {
        if (property.items) {
            if (property.items.type) {
                formattedType = `array[${property.items.type}]`;
            } else if (property.items.properties) {
                formattedType = 'array[object]';
            }
        }
    }

    return { rawType, formattedType, isNullable };
};

const jsonSchemaToTree = (schema) => {
  if (!schema) return [];

  const processOneOf = (name, property, processProperties) => {
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
    const formattedType = uniqueDataTypeStrings.join(' | ');

    const baseNode = {
      id: generateNodeId(),
      name: name,
      properties: {
        rawType: 'union',
        formattedType: formattedType,
        Nullable: isNullable ? 'Yes' : 'No',
        Description: description || ''
      },
    };

    const children = nonNullTypes.map(unionType => {
      let typeName;
      let childFormattedType;
      let childRawType;

      if (unionType.type === 'object') {
        typeName = unionType.title || 'object';
        childFormattedType = typeName;
        childRawType = 'object';
      } else if (unionType.title) {
        typeName = unionType.title;
        childFormattedType = typeName;
        childRawType = unionType.type;
      } else if (unionType.type === 'array' && unionType.items) {
        childRawType = 'array';
        if (unionType.items.type) {
          typeName = `array[${unionType.items.type}]`;
          childFormattedType = typeName;
        } else if (unionType.items.properties) {
          typeName = 'array[object]';
          childFormattedType = typeName;
        } else {
          typeName = 'array';
          childFormattedType = 'array';
        }
      } else {
        typeName = unionType.type;
        childFormattedType = typeName;
        childRawType = typeName;
      }

      const childNode = {
        id: generateNodeId(),
        name: `[${typeName}]`,
        properties: { rawType: childRawType, formattedType: childFormattedType, Nullable: 'No', Description: unionType.description || '' },
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
  };

  const processProperties = (properties) => {
    return Object.entries(properties).map(([name, property]) => {
      if (property.oneOf) {
        return processOneOf(name, property, processProperties);
      }

      // Fallback to original logic for non-oneOf properties
      const parsedType = parseType(property);
      const isArrayField = property.type === 'array';

      const baseNode = {
        id: generateNodeId(),
        name: name + (isArrayField ? '[]' : ''),
        properties: { rawType: parsedType.rawType, formattedType: parsedType.formattedType, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: property.description || '' },
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