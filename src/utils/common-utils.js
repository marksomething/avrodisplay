let idCounter = 0;

export const generateNodeId = () => {
  return `node-${idCounter++}`;
};

export const getUnionTypeInfo = (typesArray, typeParser) => {
  const nonNullTypes = typesArray.filter(t => t !== 'null');
  const isNullable = typesArray.includes('null');

  let rawType = 'union';
  let formattedType;

  if (nonNullTypes.length > 1) {
    formattedType = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null) {
        return typeParser(t).formattedType;
      }
      return t;
    }).join(' | ');
  } else if (nonNullTypes.length === 1) {
    const singleTypeResult = typeParser(nonNullTypes[0]);
    rawType = singleTypeResult.rawType;
    formattedType = singleTypeResult.formattedType;
  } else { // empty array or only null
    rawType = 'null';
    formattedType = 'null';
  }

  return { rawType, formattedType, isNullable };
};