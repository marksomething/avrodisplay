import React, { useState } from 'react';
import TreeView from './components/TreeView';
import './App.css';
import avroSchemaRaw from './schema.avsc?raw';
import jsonSchemaRaw from './schema.json?raw';
import openMetadataTableRaw from './openmetadata-table.json?raw';
import avroToTree from './utils/avro-mapper';
import jsonSchemaToTree from './utils/json-schema-mapper';
import openMetadataToTree from './utils/openmetadata-mapper';

function App() {
  const [schemaType, setSchemaType] = useState('avro');

  const avroSchema = JSON.parse(avroSchemaRaw);
  const jsonSchema = JSON.parse(jsonSchemaRaw);
  const openMetadataTable = JSON.parse(openMetadataTableRaw);

  let data;
  switch (schemaType) {
    case 'avro':
      data = avroToTree(avroSchema);
      break;
    case 'json':
      data = jsonSchemaToTree(jsonSchema);
      break;
    case 'openmetadata':
      data = openMetadataToTree(openMetadataTable);
      break;
    default:
      data = [];
  }

  return (
    <div className="App">
      <h1>Schema Tree View</h1>
      <div>
        <button onClick={() => setSchemaType('avro')}>Avro Schema</button>
        <button onClick={() => setSchemaType('json')}>JSON Schema</button>
        <button onClick={() => setSchemaType('openmetadata')}>OpenMetadata Table</button>
      </div>
      <TreeView data={data} />
    </div>
  );
}

export default App;
