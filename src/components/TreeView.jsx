
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TreeIcon from './TreeIcon';

const TreeView = ({ data }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node, ancestorsLast = [], isLast = true) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const nodeRow = (
      <tr key={node.id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => hasChildren && toggleExpand(node.id)} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            <TreeIcon ancestorsLast={ancestorsLast} isLast={isLast} hasChildren={hasChildren} isExpanded={isExpanded} />
            <span style={{ paddingLeft: '5px' }}>
              {node.name}
            </span>
          </div>
        </td>
        {Object.values(node.properties).map((value, index) => (
          <td key={index}>{String(value)}</td>
        ))}
      </tr>
    );

    const childRows = isExpanded && hasChildren
      ? node.children.flatMap((child, index) => renderNode(child, [...ancestorsLast, isLast], index === node.children.length - 1))
      : [];

    return [nodeRow, ...childRows];
  };

  const headers = data.length > 0 ? ['Name', ...Object.keys(data[0].properties)] : [];

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.flatMap((node, index) => renderNode(node, [], index === data.length - 1))}
      </tbody>
    </table>
  );
};

TreeView.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      children: PropTypes.array,
      properties: PropTypes.object.isRequired,
    })
  ).isRequired,
};

export default TreeView;
