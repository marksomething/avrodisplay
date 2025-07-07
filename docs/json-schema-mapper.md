# JSON Schema Mapper

`json-schema-mapper.js` is a utility that transforms a JSON Schema into a tree-like structure, suitable for display in a hierarchical viewer. It processes JSON Schema properties, handling nested objects, arrays, and `oneOf` union types.

## Function: `jsonSchemaToTree(schema)`

Transforms a given JSON Schema object into a standardized tree data format.

### Parameters

-   `schema` (Object): The JSON Schema object to be transformed. Expected to be a valid JSON Schema.

### Returns

-   `Array<Object>`: An array of tree nodes, where each node has the following structure:
    -   `id` (string): A unique identifier for the node.
    -   `name` (string): The display name of the field. For array types, `[]` is appended (e.g., `items[]`). For `oneOf` types, the specific type is enclosed in brackets (e.g., `[string]`, `[EmailContact]`).
    -   `properties` (Object): An object containing key-value pairs describing the field:
        -   `rawType` (string): The base JSON Schema data type of the field (e.g., `string`, `integer`, `array`, `object`, `union`).
        -   `formattedType` (string): The formatted JSON Schema data type of the field (e.g., `string`, `integer`, `array[string]`, `object`). For `oneOf` types, it lists all non-null types (using their `title` if available, otherwise their `type`) separated by ` | `.
        -   `Nullable` (string): Indicates if the field is nullable (`Yes` or `No`).
        -   `Description` (string): The `description` from the JSON Schema, if available.
    -   `children` (Array<Object>, optional): An array of child nodes, recursively following the same structure, for complex types like objects or `oneOf` unions with multiple non-null options.

## `oneOf` Union Type Handling

When a JSON Schema property uses `oneOf` to define a union of types, the `jsonSchemaToTree` function processes it as follows:

-   If `null` is part of the `oneOf` array, the `Nullable` property of the parent node is set to `Yes`.
-   If there are multiple non-null options in the `oneOf` array, each non-null option (whether primitive or complex) is represented as a child node under the parent field.
-   The `name` of these child nodes is formatted as `[TypeName]` (e.g., `[string]`, `[EmailContact]`).
-   The `rawType` and `formattedType` for these child nodes reflect their specific type (using `title` for objects if available, otherwise `object`).

## Example

Given a JSON Schema snippet:

```json
{
  "type": "object",
  "properties": {
    "contact_info": {
      "description": "Contact information, can be a phone number or an email.",
      "oneOf": [
        { "type": "string", "format": "email", "title": "EmailContact" },
        { "type": "string", "pattern": "^\\+[1-9]\\d{1,14}$", "title": "PhoneContact" },
        { "type": "object", "title": "AddressContact", "properties": { "street": { "type": "string" } } },
        { "type": "null" }
      ]
    }
  }
}
```

`jsonSchemaToTree` would produce a structure similar to:

```json
[
  {
    "id": "node-0",
    "name": "contact_info",
    "properties": {
      "rawType": "union",
      "formattedType": "EmailContact | PhoneContact | AddressContact",
      "Nullable": "Yes",
      "Description": "Contact information, can be a phone number or an email."
    },
    "children": [
      {
        "id": "node-1",
        "name": "[EmailContact]",
        "properties": {
          "rawType": "string",
          "formattedType": "EmailContact",
          "Nullable": "No",
          "Description": ""
        }
      },
      {
        "id": "node-2",
        "name": "[PhoneContact]",
        "properties": {
          "rawType": "string",
          "formattedType": "PhoneContact",
          "Nullable": "No",
          "Description": ""
        }
      },
      {
        "id": "node-3",
        "name": "[AddressContact]",
        "properties": {
          "rawType": "object",
          "formattedType": "AddressContact",
          "Nullable": "No",
          "Description": ""
        },
        "children": [
          {
            "id": "node-4",
            "name": "street",
            "properties": {
              "rawType": "string",
              "formattedType": "string",
              "Nullable": "No",
              "Description": ""
            }
          }
        ]
      }
    ]
  }
]
```