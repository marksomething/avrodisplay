import React from 'react';
import TreeView from './components/TreeView';
import './App.css';
import schemaRaw from './schema.avsc?raw';
import avroToTree from './utils/avro-mapper';

function App() {
  const schema = JSON.parse(schemaRaw);
  const data = avroToTree(schema);

  return (
    <div className="App">
      <h1>Avro Schema Tree View</h1>
      <TreeView data={data} />
    </div>
  );
}

export default App;
