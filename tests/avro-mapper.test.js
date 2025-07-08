import { describe, it, expect } from 'vitest';
import avroToTree from '../src/utils/avro-mapper';

describe('avroToTree', () => {
  it('should correctly map a simple Avro record schema', () => {
    const avroSchema = {
      type: 'record',
      name: 'User',
      fields: [
        { name: 'id', type: 'long', doc: 'User ID' },
        { name: 'name', type: 'string' },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({
      name: 'id',
      dataType: 'long',
      dataTypeDisplay: 'long',
      constraint: ['NOT_NULL'],
      Description: 'User ID',
      fqn: 'id',
    });
    expect(tree[1]).toMatchObject({
      name: 'name',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'name',
    });
  });

  it('should handle nullable fields', () => {
    const avroSchema = {
      type: 'record',
      name: 'Product',
      fields: [
        { name: 'price', type: ['null', 'double'] },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'price',
      dataType: 'double',
      dataTypeDisplay: 'double',
      constraint: ['NULL'],
      Description: '',
    });
  });

  it('should handle complex types (record within record)', () => {
    const avroSchema = {
      type: 'record',
      name: 'Order',
      fields: [
        { name: 'orderId', type: 'string' },
        {
          name: 'customer',
          type: {
            type: 'record',
            name: 'Customer',
            fields: [
              { name: 'customerId', type: 'long' },
              { name: 'email', type: 'string' },
            ],
          },
        },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(2);
    expect(tree[1].name).toBe('customer');
    expect(tree[1].children).toHaveLength(2);
    expect(tree[1].children[0]).toMatchObject({
      name: 'customerId',
      dataType: 'long',
      dataTypeDisplay: 'long',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'customer.customerId',
    });
  });

  it('should handle array of primitive types', () => {
    const avroSchema = {
      type: 'record',
      name: 'Tags',
      fields: [
        { name: 'tags', type: { type: 'array', items: 'string' } },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'tags[]',
      dataType: 'array',
      dataTypeDisplay: 'array[string]',
      constraint: ['NOT_NULL'],
      Description: '',
    });
  });

  it('should handle array of records', () => {
    const avroSchema = {
      type: 'record',
      name: 'Cart',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            items: {
              type: 'record',
              name: 'Item',
              fields: [
                { name: 'itemId', type: 'long' },
                { name: 'quantity', type: 'int' },
              ],
            },
          },
        },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('items[]');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]).toMatchObject({
      name: 'itemId',
      dataType: 'long',
      dataTypeDisplay: 'long',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'items[].itemId',
    });
  });

  it('should handle unions with multiple non-null options as child nodes', () => {
    const avroSchema = {
      type: 'record',
      name: 'Event',
      fields: [
        {
          name: 'payload',
          type: [
            'null',
            { type: 'record', name: 'LoginEvent', fields: [{ name: 'userId', type: 'string' }] },
            { type: 'record', name: 'LogoutEvent', fields: [{ name: 'timestamp', type: 'long' }] },
            'string',
            'int',
          ],
        },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('payload');
    expect(tree[0].constraint).toEqual(['NULL']);
    expect(tree[0].children).toHaveLength(4); // LoginEvent, LogoutEvent, string, int

    expect(tree[0].children[0]).toMatchObject({
      name: '[LoginEvent]',
      dataType: 'record',
      dataTypeDisplay: 'LoginEvent',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'payload[LoginEvent]',
    });
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe('userId');

    expect(tree[0].children[1]).toMatchObject({
      name: '[LogoutEvent]',
      dataType: 'record',
      dataTypeDisplay: 'LogoutEvent',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'payload[LogoutEvent]',
    });
    expect(tree[0].children[1].children).toHaveLength(1);
    expect(tree[0].children[1].children[0].name).toBe('timestamp');

    expect(tree[0].children[2]).toMatchObject({
      name: '[string]',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'payload[string]',
    });

    expect(tree[0].children[3]).toMatchObject({
      name: '[int]',
      dataType: 'int',
      dataTypeDisplay: 'int',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'payload[int]',
    });
  });

  it('should handle array of unions', () => {
    const avroSchema = {
      type: 'record',
      name: 'MixedItems',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            items: [
              'null',
              'string',
              { type: 'record', name: 'ComplexItem', fields: [{ name: 'value', type: 'int' }] },
            ],
          },
        },
      ],
    };
    const tree = avroToTree(avroSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('items[]');
    expect(tree[0].constraint).toEqual(['NOT_NULL']); // Array itself is not nullable
    expect(tree[0].children).toHaveLength(2); // string, ComplexItem

    expect(tree[0].children[0]).toMatchObject({
      name: '[string]',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'items[][string]',
    });

    expect(tree[0].children[1]).toMatchObject({
      name: '[ComplexItem]',
      dataType: 'record',
      dataTypeDisplay: 'ComplexItem',
      constraint: ['NOT_NULL'],
      Description: '',
      fqn: 'items[][ComplexItem]',
    });
    expect(tree[0].children[1].children).toHaveLength(1);
    expect(tree[0].children[1].children[0].name).toBe('value');
  });
});