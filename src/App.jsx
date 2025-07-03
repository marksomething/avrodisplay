import React from 'react';
import TreeView from './components/TreeView';
import './App.css';

function App() {
  // The data prop passed to the TreeView component should be an array of node objects.
  // Each node object has the following structure:
  // {
  //   id: PropTypes.string.isRequired,
  //   name: PropTypes.string.isRequired,
  //   children: PropTypes.array, // Array of node objects
  //   properties: PropTypes.object.isRequired,
  // }
  const data = [
    {
      id: 'root',
      name: 'root',
      properties: {
        size: '100MB',
        type: 'folder',
        created: '2023-01-01',
        modified: '2023-01-15',
        owner: 'admin',
        group: 'admin',
        permissions: 'rwxr-xr-x',
        checksum: 'N/A',
        version: '1.0',
        author: 'system',
      },
      children: [
        {
          id: '1',
          name: 'folder1',
          properties: {
            size: '50MB',
            type: 'folder',
            created: '2023-01-02',
            modified: '2023-01-10',
            owner: 'admin',
            group: 'admin',
            permissions: 'rwxr-xr-x',
            checksum: 'N/A',
            version: '1.0',
            author: 'system',
          },
          children: [
            {
              id: '3',
              name: 'file1.txt',
              properties: {
                size: '10MB',
                type: 'file',
                created: '2023-01-03',
                modified: '2023-01-05',
                owner: 'user1',
                group: 'users',
                permissions: 'rw-r--r--',
                checksum: 'md5:abcde12345',
                version: '1.1',
                author: 'user1',
              },
            },
          ],
        },
        {
          id: '2',
          name: 'file2.txt',
          properties: {
            size: '20MB',
            type: 'file',
            created: '2023-01-04',
            modified: '2023-01-06',
            owner: 'user2',
            group: 'users',
            permissions: 'rw-r--r--',
            checksum: 'md5:fghij67890',
            version: '1.0',
            author: 'user2',
          },
        },
      ],
    },
  ];

  return (
    <div className="App">
      <h1>File System Tree View</h1>
      <TreeView data={data} />
    </div>
  );
}

export default App;
