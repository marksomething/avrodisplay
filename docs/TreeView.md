# TreeView Component Documentation

The `TreeView` component is a versatile React component designed to display hierarchical data in a tabular format, similar to a file system explorer.
It provides expandable nodes, dynamic column rendering based on data properties, and a sticky header for improved usability with large datasets.

## Capabilities

*   **Hierarchical Display:** Visualizes nested data structures (like folders and files) with clear indentation.
*   **Dynamic Property Columns:** Automatically generates columns for properties found in your data, allowing for flexible data presentation.
*   **Expandable Nodes:** Users can expand and collapse parent nodes to reveal or hide their children.
*   **Sticky Header:** The table header remains visible at the top of the viewport when scrolling, ensuring column context is always maintained.
*   **Modern Tree Lines:** Uses SVG-based tree lines to visually connect parent and child nodes, providing a clean and intuitive representation of the hierarchy.
*   **Light/Dark Mode Support:** Adapts its appearance based on the user's system `prefers-color-scheme` setting, ensuring comfortable viewing in various environments.

## Data Format

The `TreeView` component expects a `data` prop, which is an array of node objects. Each node object must adhere to the following structure:

```javascript
interface TreeNode {
  id: string; // A unique identifier for the node.
  name: string; // The name of the node, displayed in the first column.
  children?: TreeNode[]; // Optional: An array of child TreeNode objects for nested structures.
  properties: { [key: string]: any }; // An object where keys are property names (column headers) and values are their corresponding data.
}
```

**Key considerations for `properties`:**

*   The `TreeView` will automatically create columns for each unique key found in the `properties` object across all top-level nodes in your `data` array.
*   The order of columns (after the initial 'Name' column) is determined by the order of keys in the `properties` object of the first node in the `data` array.
*   All property values will be converted to strings for display.

## Usage Example

Here's how you can use the `TreeView` component with sample data:

```jsx
import React from 'react';
import TreeView from './components/TreeView';

function App() {
  const sampleData = [
    {
      id: '1',
      name: 'Folder A',
      properties: {
        Size: '100MB',
        Type: 'Folder',
        Created: '2023-01-01',
      },
      children: [
        {
          id: '1.1',
          name: 'File X.txt',
          properties: {
            Size: '10MB',
            Type: 'File',
            Created: '2023-01-05',
          },
        },
        {
          id: '1.2',
          name: 'Folder B',
          properties: {
            Size: '50MB',
            Type: 'Folder',
            Created: '2023-01-10',
          },
          children: [
            {
              id: '1.2.1',
              name: 'File Y.doc',
              properties: {
                Size: '5MB',
                Type: 'File',
                Created: '2023-01-12',
              },
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'File Z.pdf',
      properties: {
        Size: '20MB',
        Type: 'File',
        Created: '2023-01-02',
      },
    },
  ];

  return (
    <div className="App">
      <h1>My Data Explorer</h1>
      <TreeView data={sampleData} />
    </div>
  );
}

export default App;
```
