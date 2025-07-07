import { describe, it, expect } from 'vitest';
import mergeData from '../src/utils/data-merger';

describe('mergeData', () => {
  const initialTreeData = [
    {
      id: 'node-0',
      name: 'user_id',
      dataType: 'long',
      dataTypeDisplay: 'long',
      Nullable: 'No',
      Description: 'Unique user ID',
      fqn: 'user_id',
    },
    {
      id: 'node-1',
      name: 'address',
      dataType: 'record',
      dataTypeDisplay: 'record',
      Nullable: 'No',
      Description: 'User address',
      fqn: 'address',
      children: [
        {
          id: 'node-2',
          name: 'street',
          dataType: 'string',
          dataTypeDisplay: 'string',
          Nullable: 'No',
          Description: 'Street name',
          fqn: 'address.street',
        },
        {
          id: 'node-3',
          name: 'city',
          dataType: 'string',
          dataTypeDisplay: 'string',
          Nullable: 'No',
          Description: 'City name',
          fqn: 'address.city',
        },
      ],
    },
    {
      id: 'node-4',
      name: 'orders[]',
      dataType: 'array',
      dataTypeDisplay: 'array[record]',
      Nullable: 'No',
      Description: 'User orders',
      fqn: 'orders[]',
      children: [
        {
          id: 'node-5',
          name: 'order_id',
          dataType: 'long',
          dataTypeDisplay: 'long',
          Nullable: 'No',
          Description: 'Order ID',
          fqn: 'orders[].order_id',
        },
      ],
    },
  ];

  it('should merge additional properties into existing nodes', () => {
    const additionalData = {
      'user_id': { Source: 'DB', PII: 'Yes' },
      'address.street': { Source: 'API' },
    };

    const mergedTree = mergeData(initialTreeData, additionalData);

    expect(mergedTree[0]).toMatchObject({
      dataType: 'long',
      dataTypeDisplay: 'long',
      Nullable: 'No',
      Description: 'Unique user ID',
      Source: 'DB',
      PII: 'Yes',
    });

    expect(mergedTree[1].children[0]).toMatchObject({
      dataType: 'string',
      dataTypeDisplay: 'string',
      Nullable: 'No',
      Description: 'Street name',
      Source: 'API',
    });

    // Ensure other nodes are untouched
    expect(mergedTree[1].children[1]).toMatchObject({
      dataType: 'string',
      dataTypeDisplay: 'string',
      Nullable: 'No',
      Description: 'City name',
    });
  });

  it('should handle merging into array item children', () => {
    const additionalData = {
      'orders[].order_id': { Source: 'Kafka' },
    };

    const mergedTree = mergeData(initialTreeData, additionalData);

    expect(mergedTree[2].children[0]).toMatchObject({
      dataType: 'long',
      dataTypeDisplay: 'long',
      Nullable: 'No',
      Description: 'Order ID',
      Source: 'Kafka',
    });
  });

  it('should not modify original data', () => {
    const additionalData = {
      'user_id': { Source: 'DB' },
    };
    mergeData(initialTreeData, additionalData);
    expect(initialTreeData[0]).not.toHaveProperty('Source');
  });

  it('should return original data if additionalData is null or undefined', () => {
    const mergedTreeNull = mergeData(initialTreeData, null);
    expect(mergedTreeNull).toEqual(initialTreeData);

    const mergedTreeUndefined = mergeData(initialTreeData, undefined);
    expect(mergedTreeUndefined).toEqual(initialTreeData);
  });

  it('should return original data if additionalData is empty', () => {
    const mergedTreeEmpty = mergeData(initialTreeData, {});
    expect(mergedTreeEmpty).toEqual(initialTreeData);
  });

  it('should handle empty initialTreeData', () => {
    const additionalData = { 'some_field': { Source: 'Test' } };
    const mergedTree = mergeData([], additionalData);
    expect(mergedTree).toEqual([]);
  });
});
