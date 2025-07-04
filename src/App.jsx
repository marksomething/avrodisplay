import React, { useState } from 'react';
import TreeView from './components/TreeView';
import RainbowFormatter from './components/RainbowFormatter';
import StatusDotFormatter from './components/StatusDotFormatter';
import './App.css';
import avroSchemaRaw from './schema.avsc?raw';
import jsonSchemaRaw from '././schema.json?raw';
import openMetadataTableRaw from './openmetadata-table.json?raw';
import avroToTree from './utils/avro-mapper';
import jsonSchemaToTree from './utils/json-schema-mapper';
import openMetadataToTree from './utils/openmetadata-mapper';
import mergeData from './utils/data-merger';

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

  const additionalProperties = {
    // Avro example
    'id': { 'Source': 'DB', 'PII': 'Yes', 'hiddenValue1': 'a' },
    'username': { 'Source': 'API' },
    'address.street': { 'Source': 'DB' },
    'orders[].order_id': { 'Source': 'Kafka' },
    'tags[]': { 'Source': 'Manual' },

    // JSON Schema example
    'address.zip_code': { 'Source': 'External' },
    'orders[].total_amount': { 'Source': 'Stripe' },

    // OpenMetadata example
    'product_name': { 'Source': 'ERP' },
    'line_items[].quantity': { 'Source': 'Warehouse' },
  };

  const mergedData = mergeData(data, additionalProperties);

  const NullableStatusDotFormatter = (props) => (
    <StatusDotFormatter {...props} colorMap={{ 'Yes': '#28a745', 'No': '#dc3545' }} />
  );

  const fieldConfiguration = {
    Name: { formatter: RainbowFormatter },
    Type: {},
    Nullable: { formatter: NullableStatusDotFormatter },
    Description: {},
    Source: {},
    PII: {},
  };

  return (
    <div className="App">
      <h1>Schema Tree View</h1>
      <div>
        <button onClick={() => setSchemaType('avro')}>Avro Schema</button>
        <button onClick={() => setSchemaType('json')}>JSON Schema</button>
        <button onClick={() => setSchemaType('openmetadata')}>OpenMetadata Table</button>
      </div>
      <TreeView data={mergedData} fieldConfiguration={fieldConfiguration} />
    </div>
  );
}

export default App;
