import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RainbowFormatter.css';

const RainbowFormatter = ({ children }) => {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(Math.floor(Math.random() * 7));
  }, []);

  if (typeof children !== 'string') {
    return String(children);
  }

  return (
    <span>
      {children.split('').map((char, index) => (
        <span key={index} className={`rainbow-char-${(startIndex + index) % 7}`}>
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
