# Avro Mapper

`avro-mapper.js` is a utility that transforms an Avro schema into a tree-like structure, suitable for display in a hierarchical viewer. It processes Avro records, handling nested fields, arrays, and complex union types.

## Function: `avroToTree(schema)`

Transforms a given Avro schema object into a standardized tree data format.

### Parameters

-   `schema` (Object): The Avro schema object to be transformed. Expected to be a valid Avro record schema.

### Returns

-   `Array<Object>`: An array of tree nodes, where each node has the following structure:
    -   `id` (string): A unique identifier for the node.
    -   `name` (string): The display name of the field. For array types, `[]` is appended (e.g., `items[]`). For union types, the specific type is enclosed in brackets (e.g., `[string]`, `[LoginEvent]`).
    -   `dataType` (string): The base Avro data type of the field (e.g., `string`, `long`, `array`, `record`, `union`).
    -   `dataTypeDisplay` (string): The formatted Avro data type of the field (e.g., `string`, `long`, `array[string]`, `LoginEvent`). For union types, it lists all non-null types separated by ` | `.
    -   `constraint` (Array<string>): An array of constraints applied to the field. Will include `NULL` or `NOT_NULL` based on nullability, and any other Avro-specific constraints.
    -   `Description` (string): The documentation string (`doc`) from the Avro schema, if available.
    -   `fqn` (string): The Fully Qualified Name of the field, representing its path within the schema (e.g., `address.street`, `orders[].order_id`).
    -   `children` (Array<Object>, optional): An array of child nodes, recursively following the same structure, for complex types like records or unions with multiple non-null options.

## Union Type Handling

When an Avro field is defined as a union (e.g., `["null", "string", {"type": "record", "name": "LoginEvent", ...}]`), the `avroToTree` function processes it as follows:

-   If `null` is part of the union, the `constraint` array of the parent node will include `NULL`.
-   If there are multiple non-null options in the union, each non-null option (whether primitive or complex) is represented as a child node under the parent field.
-   The `name` of these child nodes is formatted as `[TypeName]` (e.g., `[string]`, `[LoginEvent]`).
-   The `dataType` and `dataTypeDisplay` for these child nodes reflect their specific type.

## Example

Given an Avro schema:

```json
{
  "type": "record",
  "name": "User",
  "fields": [
    {
      "name": "id",
      "type": "long",
      "doc": "Unique user ID"
    },
    {
      "name": "contact",
      "type": ["null", "string", {"type": "record", "name": "Email", "fields": [{"name": "address", "type": "string"}]}],
      "doc": "User contact information"
    }
  ]
}
```

`avroToTree` would produce a structure similar to:

```json
[
  {
    "id": "node-0",
    "name": "id",
    "dataType": "long",
    "dataTypeDisplay": "long",
    "constraint": ["NOT_NULL"],
    "Description": "Unique user ID",
    "fqn": "id"
  },
  {
    "id": "node-1",
    "name": "contact",
    "dataType": "union",
    "dataTypeDisplay": "string | Email",
    "constraint": ["NULL"],
    "Description": "User contact information",
    "fqn": "contact",
    "children": [
      {
        "id": "node-2",
        "name": "[string]",
        "dataType": "string",
        "dataTypeDisplay": "string",
        "constraint": ["NOT_NULL"],
        "Description": "",
        "fqn": "contact[string]"
      },
      {
        "id": "node-3",
        "name": "[Email]",
        "dataType": "record",
        "dataTypeDisplay": "Email",
        "constraint": ["NOT_NULL"],
        "Description": "",
        "fqn": "contact[Email]",
        "children": [
          {
            "id": "node-4",
            "name": "address",
            "dataType": "string",
            "dataTypeDisplay": "string",
            "constraint": ["NOT_NULL"],
            "Description": "",
            "fqn": "contact[Email].address"
          }
        ]
      }
    ]
  }
]
```