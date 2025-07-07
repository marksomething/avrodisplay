let idCounter = 0;

const parseType = (type) => {
  let isNullable = false;
  let rawType;
  let formattedType;

  if (Array.isArray(type)) {
    const nonNullTypes = type.filter(t => t !== 'null');
    isNullable = type.includes('null');

    if (nonNullTypes.length > 1) {
        rawType = 'union';
        formattedType = nonNullTypes.map(t => {
            if (typeof t === 'object' && t !== null) {
                return parseType(t).formattedType;
            }
            return t;
        }).join(' | ');
    } else if (nonNullTypes.length === 1) {
        const singleTypeResult = parseType(nonNullTypes[0]);
        rawType = singleTypeResult.rawType;
        formattedType = singleTypeResult.formattedType;
    } else { // empty array?
        rawType = 'null';
        formattedType = 'null';
    }
  } else if (typeof type === 'object' && type !== null) {
    rawType = type.type;
    if (type.type === 'array') {
        const itemTypeResult = parseType(type.items);
        formattedType = `array[${itemTypeResult.formattedType}]`;
    } else { // record, enum, fixed
      if (type.type === 'record' && type.name) {
        formattedType = type.name;
      } else {
        formattedType = type.type;
      }
      if (type.logicalType) {
        formattedType = `${formattedType}:${type.logicalType}`;
      }
    }
  } else { // primitive type
    rawType = type;
    formattedType = type;
  }

  return { rawType, formattedType, isNullable };
};

const avroToTree = (schema) => {
  if (!schema) return [];

  const processField = (field, parentFqn = '') => {
    const parsedType = parseType(field.type);
    let formattedType = parsedType.formattedType;
    if (field.logicalType && typeof field.type !== 'object') { // Apply logicalType only for primitive types directly on the field
      formattedType = `${formattedType}:${field.logicalType}`;
    }
    const isArrayField = typeof field.type === 'object' && field.type !== null && field.type.type === 'array';

    const currentFieldName = field.name + (isArrayField ? '[]' : '');
    const currentFqn = parentFqn ? `${parentFqn}.${currentFieldName}` : currentFieldName;

    const baseNode = {
      id: `node-${idCounter++}`,
      name: currentFieldName,
      properties: { rawType: parsedType.rawType, formattedType: formattedType, Nullable: parsedType.isNullable ? 'Yes' : 'No', Description: field.doc || '' },
      fqn: currentFqn,
    };

    let children = [];

    if (typeof field.type === 'object' && field.type !== null && !Array.isArray(field.type)) {
      if (field.type.type === 'record') {
        children = field.type.fields.map(f => processField(f, baseNode.fqn));
      } else if (field.type.type === 'array') {
        if (Array.isArray(field.type.items)) {
            const nonNullItemTypes = field.type.items.filter(t => t !== 'null');
            if (nonNullItemTypes.length > 1) {
                children = nonNullItemTypes.map(unionItemType => {
                    let unionItemTypeName;
                    let unionItemFormattedType;
                    let unionItemRawType;
                    let unionItemChildren = [];

                    if (typeof unionItemType === 'object' && unionItemType !== null) {
                        const parsedUnionItemType = parseType(unionItemType);
                        unionItemTypeName = unionItemType.name || unionItemType.type;
                        unionItemFormattedType = parsedUnionItemType.formattedType;
                        unionItemRawType = parsedUnionItemType.rawType;
                        if (unionItemType.type === 'record') {
                            unionItemChildren = unionItemType.fields.map(f => processField(f, `${baseNode.fqn}[${unionItemTypeName}]`));
                        }
                    } else {
                        const parsedUnionItemType = parseType(unionItemType);
                        unionItemTypeName = unionItemType;
                        unionItemFormattedType = parsedUnionItemType.formattedType;
                        unionItemRawType = parsedUnionItemType.rawType;
                    }

                    const unionItemNode = {
                        id: `node-${idCounter++}`,
                        name: `[${unionItemTypeName}]`,
                        properties: { rawType: unionItemRawType, formattedType: unionItemFormattedType, Nullable: 'No', Description: '' },
                        fqn: `${baseNode.fqn}[${unionItemTypeName}]`
                    };

                    if (unionItemChildren.length > 0) {
                        unionItemNode.children = unionItemChildren;
                    }
                    return unionItemNode;
                });
            } else if (nonNullItemTypes.length === 1 && typeof nonNullItemTypes[0] === 'object' && nonNullItemTypes[0] !== null && nonNullItemTypes[0].type === 'record') {
                children = nonNullItemTypes[0].fields.map(f => processField(f, baseNode.fqn));
            }
        } else if (typeof field.type.items === 'object' && field.type.items !== null && field.type.items.type === 'record') {
          children = field.type.items.fields.map(f => processField(f, baseNode.fqn));
        }
      }
    } else if (Array.isArray(field.type)) {
        const nonNullTypes = field.type.filter(t => t !== 'null');
        if (nonNullTypes.length > 1) { // If there's more than one non-null type in the union
            children = nonNullTypes.map(unionType => {
                let unionTypeName;
                let unionFormattedType;
                let unionRawType;
                let unionChildren = [];

                if (typeof unionType === 'object' && unionType !== null) {
                    const parsedUnionType = parseType(unionType);
                    unionTypeName = unionType.name || unionType.type;
                    unionFormattedType = parsedUnionType.formattedType;
                    unionRawType = parsedUnionType.rawType;
                    if (unionType.type === 'record') {
                        unionChildren = unionType.fields.map(f => processField(f, `${baseNode.fqn}[${unionTypeName}]`));
                    } else if (unionType.type === 'array' && typeof unionType.items === 'object' && unionType.items !== null && unionType.items.type === 'record') {
                        unionChildren = unionType.items.fields.map(f => processField(f, `${baseNode.fqn}[${unionTypeName}]`));
                    }
                } else {
                    const parsedUnionType = parseType(unionType);
                    unionTypeName = unionType; // e.g., "string", "int"
                    unionFormattedType = parsedUnionType.formattedType;
                    unionRawType = parsedUnionType.rawType;
                }

                const unionNode = {
                    id: `node-${idCounter++}`,
                    name: `[${unionTypeName}]`, // Display name for the child node
                    properties: { rawType: unionRawType, formattedType: unionFormattedType, Nullable: 'No', Description: '' }, // Nullable is 'No' for the specific union branch
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