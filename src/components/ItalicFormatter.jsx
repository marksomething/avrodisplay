import React from 'react';
import PropTypes from 'prop-types';

const ItalicFormatter = ({ children }) => {
  return <em style={{ fontStyle: 'italic' }}>{children}</em>;
};

ItalicFormatter.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ItalicFormatter;
