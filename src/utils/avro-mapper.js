let idCounter = 0;

const parseType = (type) => {
  let isNullable = false;
  let typeString;

  if (Array.isArray(type)) {
    const nonNullTypes = type.filter(t => t !== 'null');
    isNullable = type.includes('null');
    typeString = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null) {
        const innerTypeResult = parseType(t);
        return innerTypeResult.type;
      }
      return t;
    }).join(' | ');
  } else if (typeof type === 'object' && type !== null) {
    if (type.type === 'array') {
        const itemTypeResult = parseType(type.items);
        typeString = `array[${itemTypeResult.type}]`;
    } else {
      if (type.type === 'record' && type.name) {
        typeString = type.name;
      } else {
        typeString = type.type;
      }
      if (type.logicalType) {
        typeString = `${typeString}:${type.logicalType}`;
      }
    }
  } else {
    typeString = type;
  }

  return { type: typeString, isNullable };
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const processField = (field, parentFqn = '') => {
    const parsedType = parseType(field.type);
    let dataType = parsedType.type;
    if (field.logicalType && typeof field.type !== 'object') { // Apply logicalType only for primitive types directly on the field
      dataType = `${dataType}:${field.logicalType}`;
    }
    const isArrayField = typeof field.type === 'object' && field.type !== null && field.type.type === 'array';

    const currentFieldName = field.name + (isArrayField ? '[]' : '');
    const currentFqn = parentFqn ? `${parentFqn}.${currentFieldName}` : currentFieldName;

    const baseNode = {
      id: `node-${idCounter++}`,
      name: currentFieldName,
      properties: { DataType: dataType, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: field.doc || '' },
      fqn: currentFqn,
    };

    let children = [];

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        children = field.type.fields.map(f => processField(f, baseNode.fqn));
      } else if (field.type.type === 'array') {
        if (Array.isArray(field.type.items)) {
            const nonNullItemTypes = field.type.items.filter(t => t !== 'null');
            children = nonNullItemTypes.flatMap(unionItemType => {
                if (typeof unionItemType === 'object' && unionItemType !== null) {
                    const unionItemTypeName = unionItemType.name || unionItemType.type;
                    const unionItemNodeFqn = `${baseNode.fqn}[${unionItemTypeName}]`;
                    const unionItemNode = {
                        id: `node-${idCounter++}`,
                        name: `[${unionItemTypeName}]`,
                        properties: { DataType: unionItemTypeName, Nullable: 'No', Description: '' },
                        fqn: unionItemNodeFqn
                    };
                    if (unionItemType.type === 'record') {
                        unionItemNode.children = unionItemType.fields.map(f => processField(f, unionItemNodeFqn));
                    }
                    return unionItemNode;
                }
                return [];
            });
        } else if (typeof field.type.items === 'object' && field.type.items !== null && field.type.items.type === 'record') {
          children = field.type.items.fields.map(f => processField(f, baseNode.fqn));
        }
      }
    } else if (Array.isArray(field.type)) {
        const nonNullTypes = field.type.filter(t => t !== 'null');
        if (nonNullTypes.length > 1) { // If there's more than one non-null type in the union
            children = nonNullTypes.map(unionType => {
                let unionTypeName;
                let unionDataType;
                let unionChildren = [];

                if (typeof unionType === 'object' && unionType !== null) {
                    // Handle complex types (records, arrays of records)
                    unionTypeName = unionType.name || unionType.type;
                    unionDataType = unionTypeName;
                    if (unionType.type === 'record') {
                        unionChildren = unionType.fields.map(f => processField(f, `${baseNode.fqn}[${unionTypeName}]`));
                    } else if (unionType.type === 'array' && typeof unionType.items === 'object' && unionType.items !== null && unionType.items.type === 'record') {
                        unionChildren = unionType.items.fields.map(f => processField(f, `${baseNode.fqn}[${unionTypeName}]`));
                    }
                } else {
                    // Handle primitive types
                    unionTypeName = unionType; // e.g., "string", "int"
                    unionDataType = unionType;
                }

                const unionNode = {
                    id: `node-${idCounter++}`,
                    name: `[${unionTypeName}]`, // Display name for the child node
                    properties: { DataType: unionDataType, Nullable: 'No', Description: '' }, // Nullable is 'No' for the specific union branch
                    fqn: `${baseNode.fqn}[${unionTypeName}]` // FQN for the union branch
                };

                if (unionChildren.length > 0) {
                    unionNode.children = unionChildren;
                }
                return unionNode;
            });
        }
    }

    if (children.length > 0) {
        baseNode.children = children;
    }

    return baseNode;
  };

  if (schema.type === 'record') {
    return schema.fields.map(f => processField(f, ''));
  }

  return [];
};

export default avroToTree;
