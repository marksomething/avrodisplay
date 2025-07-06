# OpenMetadata Mapper

`openmetadata-mapper.js` is a utility that transforms an OpenMetadata table schema into a tree-like structure, suitable for display in a hierarchical viewer. It processes OpenMetadata columns, handling nested structs, arrays, and union types.

## Function: `openMetadataToTree(schema)`

Transforms a given OpenMetadata table schema object into a standardized tree data format.

### Parameters

-   `schema` (Object): The OpenMetadata table schema object to be transformed.

### Returns

-   `Array<Object>`: An array of tree nodes, where each node has the following structure:
    -   `id` (string): A unique identifier for the node.
    -   `name` (string): The display name of the column. For array types, `[]` is appended (e.g., `line_items[]`). For union types, the specific type is enclosed in brackets (e.g., `[VARCHAR]`, `[email_contact]`).
    -   `properties` (Object): An object containing key-value pairs describing the column:
        -   `DataType` (string): The OpenMetadata data type of the column (e.g., `BIGINT`, `VARCHAR`, `ARRAY[VARCHAR]`, `STRUCT`). For union types, it lists all non-null types (using their `name` if available, otherwise their `dataType`) separated by ` | `.
        -   `Nullable` (string): Indicates if the column is nullable (`Yes` or `No`). This is determined by the `nullable` property or the presence of a `NULL` type in a `UNION`.
        -   `Description` (string): The `description` from the OpenMetadata schema, if available.
    -   `children` (Array<Object>, optional): An array of child nodes, recursively following the same structure, for complex types like `STRUCT` or `UNION` with multiple non-null options.

## Union Type Handling

When an OpenMetadata column is defined as a `UNION` type, the `openMetadataToTree` function processes it as follows:

-   If a `NULL` type is part of the `children` array of the `UNION`, the `Nullable` property of the parent node is set to `Yes`.
-   If there are multiple non-null options in the `UNION`'s `children` array, each non-null option (whether primitive or complex) is represented as a child node under the parent column.
-   The `name` of these child nodes is formatted as `[TypeName]` (e.g., `[VARCHAR]`, `[email_contact]`). For primitive types without a `name`, their `dataType` is used as the `TypeName`.
-   The `DataType` for these child nodes reflects their specific type.

## Example

Given an OpenMetadata schema snippet:

```json
{
  "columns": [
    {
      "name": "contact_preference",
      "dataType": "UNION",
      "description": "User's preferred contact method, can be email or phone.",
      "children": [
        {
          "name": "email_contact",
          "dataType": "STRUCT",
          "children": [
            {
              "name": "email_address",
              "dataType": "VARCHAR"
            }
          ]
        },
        {
          "name": "phone_contact",
          "dataType": "STRUCT",
          "children": [
            {
              "name": "phone_number",
              "dataType": "VARCHAR"
            }
          ]
        },
        {
          "dataType": "VARCHAR"
        },
        {
          "dataType": "INT"
        },
        {
          "dataType": "NULL"
        }
      ]
    }
  ]
}
```

`openMetadataToTree` would produce a structure similar to:

```json
[
  {
    "id": "node-0",
    "name": "contact_preference",
    "properties": {
      "DataType": "email_contact | phone_contact | VARCHAR | INT",
      "Nullable": "Yes",
      "Description": "User's preferred contact method, can be email or phone."
    },
    "children": [
      {
        "id": "node-1",
        "name": "[email_contact]",
        "properties": {
          "DataType": "STRUCT",
          "Nullable": "No",
          "Description": "Email contact details."
        },
        "children": [
          {
            "id": "node-2",
            "name": "email_address",
            "properties": {
              "DataType": "VARCHAR",
              "Nullable": "No",
              "Description": ""
            }
          }
        ]
      },
      {
        "id": "node-3",
        "name": "[phone_contact]",
        "properties": {
          "DataType": "STRUCT",
          "Nullable": "No",
          "Description": "Phone contact details."
        },
        "children": [
          {
            "id": "node-4",
            "name": "phone_number",
            "properties": {
              "DataType": "VARCHAR",
              "Nullable": "No",
              "Description": ""
            }
          }
        ]
      },
      {
        "id": "node-5",
        "name": "[VARCHAR]",
        "properties": {
          "DataType": "VARCHAR",
          "Nullable": "No",
          "Description": ""
        }
      },
      {
        "id": "node-6",
        "name": "[INT]",
        "properties": {
          "DataType": "INT",
          "Nullable": "No",
          "Description": ""
        }
      }
    ]
  }
]
```
