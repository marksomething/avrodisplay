import { describe, it, expect } from 'vitest';
import openMetadataToTree from '../src/utils/openmetadata-mapper';

describe('openMetadataToTree', () => {
  it('should correctly map a simple OpenMetadata table schema', () => {
    const omSchema = {
      columns: [
        { name: 'id', dataType: 'BIGINT', description: 'User ID' },
        { name: 'name', dataType: 'VARCHAR', dataLength: 255 },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({
      name: 'id',
      dataType: 'BIGINT',
      dataTypeDisplay: 'BIGINT',
      Nullable: 'No',
      Description: 'User ID',
    });
    expect(tree[1]).toMatchObject({
      name: 'name',
      dataType: 'VARCHAR',
      dataTypeDisplay: 'VARCHAR',
      Nullable: 'No',
      Description: '',
    });
  });

  it('should handle nullable fields', () => {
    const omSchema = {
      columns: [
        { name: 'delivery_date', dataType: 'TIMESTAMP', nullable: true },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'delivery_date',
      dataType: 'TIMESTAMP',
      dataTypeDisplay: 'TIMESTAMP',
      Nullable: 'Yes',
    });
  });

  it('should handle STRUCT types', () => {
    const omSchema = {
      columns: [
        {
          name: 'customer_info',
          dataType: 'STRUCT',
          children: [
            { name: 'customer_id', dataType: 'BIGINT' },
            { name: 'email', dataType: 'VARCHAR' },
          ],
        },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('customer_info');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]).toMatchObject({
      name: 'customer_id',
      dataType: 'BIGINT',
      dataTypeDisplay: 'BIGINT',
      Nullable: 'No',
    });
    expect(tree[0].children[1]).toMatchObject({
      name: 'email',
      dataType: 'VARCHAR',
      dataTypeDisplay: 'VARCHAR',
      Nullable: 'No',
    });
  });

  it('should handle ARRAY of primitive types', () => {
    const omSchema = {
      columns: [
        { name: 'tags', dataType: 'ARRAY', arrayDataType: 'VARCHAR' },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'tags[]',
      dataType: 'ARRAY',
      dataTypeDisplay: 'ARRAY[VARCHAR]',
      Nullable: 'No',
    });
  });

  it('should handle ARRAY of STRUCT types', () => {
    const omSchema = {
      columns: [
        {
          name: 'line_items',
          dataType: 'ARRAY',
          arrayDataType: 'STRUCT',
          children: [
            { name: 'item_id', dataType: 'BIGINT' },
            { name: 'quantity', dataType: 'INT' },
          ],
        },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('line_items[]');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]).toMatchObject({
      name: 'item_id',
      dataType: 'BIGINT',
      dataTypeDisplay: 'BIGINT',
      Nullable: 'No',
    });
    expect(tree[0].children[1]).toMatchObject({
      name: 'quantity',
      dataType: 'INT',
      dataTypeDisplay: 'INT',
      Nullable: 'No',
    });
  });

  it('should handle UNION types with multiple non-null options as child nodes', () => {
    const omSchema = {
      columns: [
        {
          name: 'contact_preference',
          dataType: 'UNION',
          children: [
            { name: 'email_contact', dataType: 'STRUCT', children: [{ name: 'email_address', dataType: 'VARCHAR' }] },
            { name: 'phone_contact', dataType: 'STRUCT', children: [{ name: 'phone_number', dataType: 'VARCHAR' }] },
            { dataType: 'VARCHAR' },
            { dataType: 'INT' },
            { dataType: 'NULL' },
          ],
        },
      ],
    };
    const tree = openMetadataToTree(omSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('contact_preference');
    expect(tree[0].Nullable).toBe('Yes');
    expect(tree[0].dataTypeDisplay).toBe('email_contact | phone_contact | VARCHAR | INT');
    expect(tree[0].children).toHaveLength(4); // email_contact, phone_contact, string_option, int_option

    expect(tree[0].children[0]).toMatchObject({
      name: '[email_contact]',
      dataType: 'STRUCT',
      dataTypeDisplay: 'STRUCT',
      Nullable: 'No',
      Description: '',
    });
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0]).toMatchObject({
      name: 'email_address',
      dataType: 'VARCHAR',
      dataTypeDisplay: 'VARCHAR',
      Nullable: 'No',
    });

    expect(tree[0].children[1]).toMatchObject({
      name: '[phone_contact]',
      dataType: 'STRUCT',
      dataTypeDisplay: 'STRUCT',
      Nullable: 'No',
      Description: '',
    });
    expect(tree[0].children[1].children).toHaveLength(1);
    expect(tree[0].children[1].children[0]).toMatchObject({
      name: 'phone_number',
      dataType: 'VARCHAR',
      dataTypeDisplay: 'VARCHAR',
      Nullable: 'No',
    });

    expect(tree[0].children[2]).toMatchObject({
      name: '[VARCHAR]',
      dataType: 'VARCHAR',
      dataTypeDisplay: 'VARCHAR',
      Nullable: 'No',
      Description: '',
    });

    expect(tree[0].children[3]).toMatchObject({
      name: '[INT]',
      dataType: 'INT',
      dataTypeDisplay: 'INT',
      Nullable: 'No',
      Description: '',
    });
  });
});
