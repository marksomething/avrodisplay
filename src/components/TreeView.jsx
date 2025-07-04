import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TreeIcon from './TreeIcon';

const TreeView = ({ data, fieldConfiguration }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const headers = fieldConfiguration
    ? ['Name', ...Object.keys(fieldConfiguration).filter(header => header !== 'Name' && !fieldConfiguration[header]?.renderAsSecondLine)]
    : (data.length > 0 ? ['Name', ...Object.keys(data[0].properties)] : []);

  const renderNode = (node, ancestorsLast = [], isLast = true, rowIndex) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const secondLineFields = Object.keys(fieldConfiguration).filter(header => fieldConfiguration[header]?.renderAsSecondLine);
    const secondLineContent = secondLineFields.length > 0 ? (
      <div>
        {secondLineFields.map(header => {
          const value = node.properties[header];
          const Formatter = fieldConfiguration[header]?.formatter;
          return Formatter ? React.createElement(Formatter, null, value) : String(value || '');
        })}
      </div>
    ) : null;

    const nodeRow = (
      <tr key={node.id} className={secondLineContent ? 'has-second-line' : ''}>
        <td className="tree-cell">
          <div style={{ display: 'flex', alignItems: 'center', cursor: hasChildren ? 'pointer' : 'default' }} onClick={() => hasChildren && toggleExpand(node.id)}>
            <TreeIcon ancestorsLast={ancestorsLast} isLast={isLast} hasChildren={hasChildren} isExpanded={isExpanded} hasSecondLine={!!secondLineContent} />
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

    const secondLineRow = secondLineContent ? (
      <tr key={`${node.id}-second-line`} className="second-line-row">
        <td className="tree-cell">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {ancestorsLast.map((isAncestorLast, i) => (
              <svg key={i} width="20" height="40" style={{ display: 'block' }}>
                {!isAncestorLast && (
                  <line
                    x1="10"
                    y1="0"
                    x2="10"
                    y2="40"
                    stroke="var(--border-color)"
                    strokeWidth="1"
                    strokeDasharray="2, 2"
                  />
                )}
              </svg>
            ))}
            <svg width="20" height="40" style={{ display: 'block' }}>
              {!isLast && (
                <line
                  x1="10"
                  y1="0"
                  x2="10"
                  y2="40"
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="2, 2"
                />
              )}
            </svg>
          </div>
        </td>
        <td colSpan={headers.length - 1}>
          {secondLineContent}
        </td>
      </tr>
    ) : null;

    const childRows = isExpanded && hasChildren
      ? node.children.flatMap((child, index) => renderNode(child, [...ancestorsLast, isLast], index === node.children.length - 1, rowIndex + 1))
      : [];

    return [nodeRow, secondLineRow, ...childRows].filter(Boolean);
  };

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{(fieldConfiguration && fieldConfiguration[header] && fieldConfiguration[header].title) || header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.flatMap((node, index) => renderNode(node, [], index === data.length - 1, index))}
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