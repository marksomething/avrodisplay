import React, { useState } from 'react';
import TreeView from './components/TreeView';
import RainbowFormatter from './components/RainbowFormatter';
import StatusDotFormatter from './components/StatusDotFormatter';
import ItalicFormatter from './components/ItalicFormatter';
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
  const [showRawData, setShowRawData] = useState(false);
  const [showMergedData, setShowMergedData] = useState(false);

  const avroSchema = JSON.parse(avroSchemaRaw);
  const jsonSchema = JSON.parse(jsonSchemaRaw);
  const openMetadataTable = JSON.parse(openMetadataTableRaw);

  let rawSchemaDisplay;
  let data;
  switch (schemaType) {
    case 'avro':
      data = avroToTree(avroSchema);
      rawSchemaDisplay = avroSchema;
      break;
    case 'json':
      data = jsonSchemaToTree(jsonSchema);
      rawSchemaDisplay = jsonSchema;
      break;
    case 'openmetadata':
      data = openMetadataToTree(openMetadataTable);
      rawSchemaDisplay = openMetadataTable;
      break;
    default:
      data = [];
      rawSchemaDisplay = {};
  }

  const additionalProperties = {
    // Avro example
    'id': { 'Source': 'DB', 'PII': 'Yes', 'hiddenValue1': 'a' },
    'username': { 'Source': 'API' },
    'address.street': { 'Source': 'DB' },
    'orders[].order_id': { 'Source': 'Kafka' },
    'tags[]': { 'Source': 'Manual' },
    'interactions[][ChatInteraction].chat_id': { 'Source': 'ChatSystem' },
    'interactions[][PhoneInteraction].duration': { 'Unit': 'seconds' },

    // JSON Schema example
    'address.zip_code': { 'Source': 'External' },
    'orders[].total_amount': { 'Source': 'Stripe' },
    'contact_info[EmailContact].email_address': { 'Validation': 'Strict' },
    'contact_info[PhoneContact].phone_number': { 'Region': 'US' },
    'payment_method[CreditCard].card_type': { 'Processor': 'Visa' },
    'user_status[DetailedStatus].message': { 'Severity': 'High' },

    // OpenMetadata example
    'product_name': { 'Source': 'ERP' },
    'line_items[].quantity': { 'Source': 'Warehouse' },
    'customer_info.email': { 'Verified': 'Yes' },
    'contact_preference[email_contact].email_address': { 'Type': 'Work' },
    'contact_preference[phone_contact].phone_number': { 'Type': 'Mobile' },
    'status[VARCHAR]': { 'Category': 'Operational' },
  };

  const mergedData = mergeData(data, additionalProperties);

  const ConstraintFormatter = (props) => {
    const constraints = props.children || [];
    const isNullable = constraints.includes('NULL');
    const isNotNull = constraints.includes('NOT_NULL');

    let displayValue = '';
    let color = '';

    if (isNullable) {
      displayValue = 'Yes';
      color = '#dc3545'; // Red for Nullable
    } else if (isNotNull) {
      displayValue = 'No';
      color = '#28a745'; // Green for Not Null
    }

    return <StatusDotFormatter {...props} colorMap={{ [displayValue]: color }}>{displayValue}</StatusDotFormatter>;
  };

  const fieldConfiguration = {
    Name: { title: 'Field Name' },
    dataTypeDisplay: { title: 'Data Type' },
    constraint: { formatter: ConstraintFormatter, title: 'Nullable' },
    Description: { formatter: ItalicFormatter, title: 'Description', renderAsSecondLine: true },
    Source: { formatter: RainbowFormatter, title: 'Data Source' },
    PII: { title: 'Sensitive Data' },
    Processor: {}
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

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setShowRawData(!showRawData)}>
          {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
        </button>
        {showRawData && (
          <pre className="raw-data-display" style={{ padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
            <code>{JSON.stringify(rawSchemaDisplay, null, 2)}</code>
          </pre>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setShowMergedData(!showMergedData)}>
          {showMergedData ? 'Hide Merged Data' : 'Show Merged Data'}
        </button>
        {showMergedData && (
          <pre className="raw-data-display" style={{ padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
            <code>{JSON.stringify(mergedData, null, 2)}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;