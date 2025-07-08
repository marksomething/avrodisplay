import { describe, it, expect } from 'vitest';
import jsonSchemaToTree from '../src/utils/json-schema-mapper';

describe('jsonSchemaToTree', () => {
  it('should correctly map a simple JSON schema', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'User ID' },
        name: { type: 'string' },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({
      name: 'id',
      dataType: 'integer',
      dataTypeDisplay: 'integer',
      constraint: ['NOT_NULL'],
      Description: 'User ID'
    });
    expect(tree[1]).toMatchObject({
      name: 'name',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: ''
    });
  });

  it('should handle nullable fields using array type', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        email: { type: ['string', 'null'] },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'email',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NULL']
    });
  });

  it('should handle nullable fields using nullable keyword', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'phone',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NULL']
    });
  });

  it('should handle nested objects', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
          },
        },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('address');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]).toMatchObject({
      name: 'street',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
    });
    expect(tree[0].children[1]).toMatchObject({
      name: 'city',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
    });
  });

  it('should handle array of primitive types', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: 'tags[]',
      dataType: 'array',
      dataTypeDisplay: 'array[string]',
      constraint: ['NOT_NULL'],
    });
  });

  it('should handle array of objects', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'integer' },
              quantity: { type: 'integer' },
            },
          },
        },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('items[]');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]).toMatchObject({
      name: 'itemId',
      dataType: 'integer',
      dataTypeDisplay: 'integer',
      constraint: ['NOT_NULL']
    });
    expect(tree[0].children[1]).toMatchObject({
      name: 'quantity',
      dataType: 'integer',
      dataTypeDisplay: 'integer',
      constraint: ['NOT_NULL']
    });
  });

  it('should handle oneOf with multiple non-null options as child nodes (mixed types)', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        contact: {
          oneOf: [
            { type: 'string', format: 'email', title: 'EmailContact' },
            { type: 'string', pattern: '^\\+[1-9]\\d{1,14}'},
            { type: 'object', title: 'AddressContact', properties: { street: { type: 'string' } } },
            { type: 'null' },
          ],
        },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('contact');
    expect(tree[0].constraint).toEqual(['NULL']);
    expect(tree[0].dataTypeDisplay).toBe('EmailContact | string | AddressContact');
    expect(tree[0].children).toHaveLength(3); // EmailContact, PhoneContact, AddressContact

    expect(tree[0].children[0]).toMatchObject({
      name: '[EmailContact]',
      dataType: 'string',
      dataTypeDisplay: 'EmailContact',
      constraint: ['NOT_NULL'],
      Description: '',
    });
    expect(tree[0].children[2]).toMatchObject({
      name: '[AddressContact]',
      dataType: 'object',
      dataTypeDisplay: 'AddressContact',
      constraint: ['NOT_NULL'],
      Description: ''
    });
    expect(tree[0].children[2].children).toHaveLength(1);
    expect(tree[0].children[2].children[0]).toMatchObject({
      name: 'street',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL']
    });
  });

  it('should handle oneOf with only primitive types as child nodes', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        value: {
          oneOf: [
            { type: 'string' },
            { type: 'integer' },
            { type: 'null' },
          ],
        },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('value');
    expect(tree[0].constraint).toEqual(['NULL']);
    expect(tree[0].dataTypeDisplay).toBe('string | integer');
    expect(tree[0].children).toHaveLength(2); // string, integer

    expect(tree[0].children[0]).toMatchObject({
      name: '[string]',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: '',
    });
    expect(tree[0].children[1]).toMatchObject({
      name: '[integer]',
      dataType: 'integer',
      dataTypeDisplay: 'integer',
      constraint: ['NOT_NULL'],
      Description: '',
    });
  });

  it('should handle oneOf with only primitive types as child nodes', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        value: {
          oneOf: [
            { type: 'string' },
            { type: 'integer' },
            { type: 'null' },
          ],
        },
      },
    };
    const tree = jsonSchemaToTree(jsonSchema);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('value');
    expect(tree[0].constraint).toEqual(['NULL']);
    expect(tree[0].dataTypeDisplay).toBe('string | integer');
    expect(tree[0].children).toHaveLength(2); // string, integer

    expect(tree[0].children[0]).toMatchObject({
      name: '[string]',
      dataType: 'string',
      dataTypeDisplay: 'string',
      constraint: ['NOT_NULL'],
      Description: '',
    });
    expect(tree[0].children[1]).toMatchObject({
      name: '[integer]',
      dataType: 'integer',
      dataTypeDisplay: 'integer',
      constraint: ['NOT_NULL'],
      Description: '',
    });
  });
});