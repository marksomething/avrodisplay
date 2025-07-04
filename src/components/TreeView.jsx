
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TreeIcon from './TreeIcon';

const TreeView = ({ data, fieldConfiguration }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const headers = fieldConfiguration
    ? ['Name', ...Object.keys(fieldConfiguration).filter(header => header !== 'Name')]
    : (data.length > 0 ? ['Name', ...Object.keys(data[0].properties)] : []);

  const renderNode = (node, ancestorsLast = [], isLast = true) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const nodeRow = (
      <tr key={node.id}>
        <td className="tree-cell">
          <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => hasChildren && toggleExpand(node.id)} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            <TreeIcon ancestorsLast={ancestorsLast} isLast={isLast} hasChildren={hasChildren} isExpanded={isExpanded} />
            <span style={{ paddingLeft: '5px' }}>
              {fieldConfiguration && fieldConfiguration.Name && fieldConfiguration.Name.formatter
                ? React.createElement(fieldConfiguration.Name.formatter, null, node.name)
                : node.name}
            </span>
          </div>
        </td>
        {headers.filter(header => header !== 'Name').map((header) => {
          const value = node.properties[header];
          const Formatter = fieldConfiguration && fieldConfiguration[header] && fieldConfiguration[header].formatter;
          return (
            <td key={header}>
              {Formatter ? React.createElement(Formatter, null, value) : String(value || '')}
            </td>
          );
        })}
      </tr>
    );

    const childRows = isExpanded && hasChildren
      ? node.children.flatMap((child, index) => renderNode(child, [...ancestorsLast, isLast], index === node.children.length - 1))
      : [];

    return [nodeRow, ...childRows];
  };

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
  fieldConfiguration: PropTypes.object,
};

export default TreeView;
