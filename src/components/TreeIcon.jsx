import React from 'react';

const TreeIcon = ({ ancestorsLast, isLast }) => {
  const iconWidth = 20;
  const iconHeight = 40;
  const strokeColor = '#a9a9a9';
  const strokeWidth = 1;

  return (
    <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      {ancestorsLast.map((isAncestorLast, i) => (
        <svg key={i} width={iconWidth} height={iconHeight} style={{ display: 'block' }}>
          {!isAncestorLast && (
            <line
              x1={iconWidth / 2}
              y1="0"
              x2={iconWidth / 2}
              y2={iconHeight}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}
        </svg>
      ))}
      <svg width={iconWidth} height={iconHeight} style={{ display: 'block' }}>
        <line
          x1={iconWidth / 2}
          y1="0"
          x2={iconWidth / 2}
          y2={isLast ? iconHeight / 2 : iconHeight}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <line
          x1={iconWidth / 2}
          y1={iconHeight / 2}
          x2={iconWidth}
          y2={iconHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    </span>
  );
};

export default TreeIcon;
