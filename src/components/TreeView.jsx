
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TreeView = ({ data }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const nodeRow = (
      <tr key={node.id}>
        <td style={{ paddingLeft: `${level * 20}px` }}>
          <span onClick={() => hasChildren && toggleExpand(node.id)} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            {hasChildren && (isExpanded ? '[-]' : '[+]')} {node.name}
          </span>
        </td>
        {Object.values(node.properties).map((value, index) => (
          <td key={index}>{String(value)}</td>
        ))}
      </tr>
    );

    const childRows = isExpanded && hasChildren
      ? node.children.flatMap((child) => renderNode(child, level + 1))
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
        {data.flatMap((node) => renderNode(node))}
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
