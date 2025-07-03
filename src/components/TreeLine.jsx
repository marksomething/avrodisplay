import React from 'react';
import './TreeLine.css';

const TreeLine = ({ ancestorsLast, isLast }) => {
  return (
    <span className="tree-line-container">
      {ancestorsLast.map((isAncestorLast, i) => (
        <span key={i} className={`tree-line-part ${isAncestorLast ? 'empty' : 'pipe'}`} />
      ))}
      <span className={`tree-line-part ${isLast ? 'last' : 'cross'}`} />
    </span>
  );
};

export default TreeLine;