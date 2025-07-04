import React from 'react';
import PropTypes from 'prop-types';

const RainbowFormatter = ({ children }) => {
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

  if (typeof children !== 'string') {
    return String(children);
  }

  return (
    <span>
      {children.split('').map((char, index) => (
        <span key={index} style={{ color: colors[index % colors.length] }}>
          {char}
        </span>
      ))}
    </span>
  );
};

RainbowFormatter.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RainbowFormatter;
