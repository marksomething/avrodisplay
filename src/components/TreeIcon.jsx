import React from 'react';

const TreeIcon = ({ ancestorsLast, isLast, hasChildren, isExpanded }) => {
  const iconWidth = 20;
  const iconHeight = 40;
  const strokeColor = 'var(--border-color)';
  const strokeWidth = 1;
  const dashArray = '2, 2';

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
              strokeDasharray={dashArray}
            />
          )}
        </svg>
      ))}
      <svg width={iconWidth} height={iconHeight} style={{ display: 'block' }}>
        {/* Vertical line from top to center */}
        <line
          x1={iconWidth / 2}
          y1="0"
          x2={iconWidth / 2}
          y2={iconHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
        {/* Vertical line from center to bottom (for non-last items) */}
        {!isLast && (
          <line
            x1={iconWidth / 2}
            y1={iconHeight / 2}
            x2={iconWidth / 2}
            y2={iconHeight}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}
        {/* Horizontal line (only for items without children) */}
        {!hasChildren && (
            <line
              x1={iconWidth / 2}
              y1={iconHeight / 2}
              x2={iconWidth}
              y2={iconHeight / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
        )}
        {/* Expander box for items with children */}
        {hasChildren && (
          <g transform={`translate(${iconWidth / 2 - 5}, ${iconHeight / 2 - 5})`}>
            <rect x="0" y="0" width="10" height="10" fill="var(--background-color)" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line
              x1="2"
              y1="5"
              x2="8"
              y2="5"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {!isExpanded && (
              <line
                x1="5"
                y1="2"
                x2="5"
                y2="8"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            )}
          </g>
        )}
      </svg>
    </span>
  );
};

export default TreeIcon;
