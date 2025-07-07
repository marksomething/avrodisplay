import { generateNodeId, getUnionTypeInfo } from './common-utils';

const parseType = (property) => {
    const isNullable = property.nullable === true || (Array.isArray(property.type) && property.type.includes('null'));
    const nonNullTypes = Array.isArray(property.type) ? property.type.filter(t => t !== 'null') : [property.type];

    let dataType;
    let dataTypeDisplay;

    if (nonNullTypes.length > 1) {
        const unionInfo = getUnionTypeInfo(property.type, parseType);
        dataType = unionInfo.dataType;
        dataTypeDisplay = unionInfo.dataTypeDisplay;
    } else {
        dataType = nonNullTypes[0];
        dataTypeDisplay = dataType;
    }

    if (dataType === 'array') {
        if (property.items) {
            if (property.items.type) {
                dataTypeDisplay = `array[${property.items.type}]`;
            } else if (property.items.properties) {
                dataTypeDisplay = 'array[object]';
            }
        }
    }

    return { dataType, dataTypeDisplay, isNullable };
};

const jsonSchemaToTree = (schema) => {
  if (!schema) return [];

  const createOneOfNode = (unionType, processProperties) => {
    let typeName;
    let childDataTypeDisplay;
    let childDataType;

    if (unionType.type === 'object') {
      typeName = unionType.title || 'object';
      childDataTypeDisplay = typeName;
      childDataType = 'object';
    } else if (unionType.title) {
      typeName = unionType.title;
      childDataTypeDisplay = typeName;
      childDataType = unionType.type;
    } else if (unionType.type === 'array' && unionType.items) {
      childDataType = 'array';
      if (unionType.items.type) {
        typeName = `array[${unionType.items.type}]`;
        childDataTypeDisplay = typeName;
      } else if (unionType.items.properties) {
        typeName = 'array[object]';
        childDataTypeDisplay = typeName;
      } else {
        typeName = 'array';
        childDataTypeDisplay = 'array';
      }
    } else {
      typeName = unionType.type;
      childDataTypeDisplay = typeName;
      childDataType = typeName;
    }

    const childNode = {
      id: generateNodeId(),
      name: `[${typeName}]`,
      dataType: childDataType,
      dataTypeDisplay: childDataTypeDisplay,
      Nullable: 'No',
      Description: unionType.description || '',
    };

    if (unionType.type === 'object' && unionType.properties) {
      childNode.children = processProperties(unionType.properties);
    } else if (unionType.type === 'array' && unionType.items && unionType.items.properties) {
      childNode.children = processProperties(unionType.items.properties);
    }
    return childNode;
  };

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
    const dataTypeDisplay = uniqueDataTypeStrings.join(' | ');

    const baseNode = {
      id: generateNodeId(),
      name: name,
      dataType: 'union',
      dataTypeDisplay: dataTypeDisplay,
      Nullable: isNullable ? 'Yes' : 'No',
      Description: description || '',
    };

    const children = nonNullTypes.map(unionType => createOneOfNode(unionType, processProperties));

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
        dataType: parsedType.dataType,
        dataTypeDisplay: parsedType.dataTypeDisplay,
        Nullable: parsedType.isNullable ? 'Yes' : 'No',
        Description: property.description || '',
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
