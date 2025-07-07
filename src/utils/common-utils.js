let idCounter = 0;

export const generateNodeId = () => {
  return `node-${idCounter++}`;
};

export const getUnionTypeInfo = (typesArray, typeParser) => {
  const nonNullTypes = typesArray.filter(t => t !== 'null');
  const isNullable = typesArray.includes('null');

  let dataType;
  let dataTypeDisplay;

  if (nonNullTypes.length > 1) {
    dataType = 'union';
    dataTypeDisplay = nonNullTypes.map(t => {
      if (typeof t === 'object' && t !== null) {
        return typeParser(t).dataTypeDisplay;
      }
      return t;
    }).join(' | ');
  } else if (nonNullTypes.length === 1) {
    const singleTypeResult = typeParser(nonNullTypes[0]);
    dataType = singleTypeResult.dataType;
    dataTypeDisplay = singleTypeResult.dataTypeDisplay;
  } else { // empty array or only null
    dataType = 'null';
    dataTypeDisplay = 'null';
  }

  return { dataType, dataTypeDisplay, isNullable };
};
