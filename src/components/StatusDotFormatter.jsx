import React from 'react';
import PropTypes from 'prop-types';
import './StatusDotFormatter.css';

// Simple hash function to generate a color
const stringToHslColor = (str, s, l) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const StatusDotFormatter = ({ children, colorMap }) => {
  const value = String(children);
  let dotColor = '#808080'; // Default middle grey

  if (colorMap && colorMap[value]) {
    dotColor = colorMap[value];
  } else if (!colorMap) {
    // If no colorMap is provided, use hash function for all values
    dotColor = stringToHslColor(value, 70, 50); // Medium saturation and lightness
  }

  return (
    <span className="status-dot-container">
      <span className="status-dot" style={{ backgroundColor: dotColor }} />
      {value}
    </span>
  );
};

StatusDotFormatter.propTypes = {
  children: PropTypes.node,
  colorMap: PropTypes.object,
};

export default StatusDotFormatter;
