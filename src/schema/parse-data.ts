import Ajv from 'ajv'

import { JSONSchema7, JSONSchema7Definition } from './definition-type'
import { ParseFunctions, parseValue } from './parse-value'

function parseArray(
  ajv: Ajv.Ajv,
  array: any[],
  schema: JSONSchema7,
  functions?: ParseFunctions
): any {
  const { items } = schema
  if (!items) {
    return array
  }

  const length = Array.isArray(items) ? items.length : array.length
  for (let i = 0; i < length; i++) {
    array[i] = parseData(
      ajv,
      array[i],
      Array.isArray(items) ? items[i] : items,
      functions
    )
  }

  return array
}

function parsePatternProperties(
  ajv: Ajv.Ajv,
  object: any,
  patternProperties: JSONSchema7['patternProperties'] = {},
  functions?: ParseFunctions
): any {
  const objectKeys = Object.keys(object)

  for (const schemaKey of Object.keys(patternProperties)) {
    const regexp = new RegExp(schemaKey)

    for (const objectKey of objectKeys) {
      if (regexp.test(objectKey)) {
        object[objectKey] = parseData(
          ajv,
          object[objectKey],
          patternProperties[schemaKey],
          functions
        )
      }
    }
  }

  return object
}

function parseProperties(
  ajv: Ajv.Ajv,
  object: any,
  properties: JSONSchema7['properties'] = {},
  functions?: ParseFunctions
): any {
  for (const key of Object.keys(properties)) {
    object[key] = parseData(ajv, object[key], properties[key], functions)
  }
  return object
}

function parseObject(
  ajv: Ajv.Ajv,
  object: any,
  schema: JSONSchema7,
  functions?: ParseFunctions
): any {
  const { patternProperties, properties } = schema
  if (patternProperties) {
    object = parsePatternProperties(ajv, object, patternProperties, functions)
  }
  if (properties) {
    object = parseProperties(ajv, object, properties, functions)
  }
  return object
}

function parseConditions(
  ajv: Ajv.Ajv,
  data: any,
  conditions: JSONSchema7Definition[],
  functions?: ParseFunctions
) {
  for (const schema of conditions) {
    if (ajv.validate(schema, data)) {
      return parseData(ajv, data, schema, functions)
    }
  }
}

export function parseData<T = any>(
  ajv: Ajv.Ajv,
  data: any,
  schema?: JSONSchema7Definition,
  functions?: ParseFunctions
): T {
  if (typeof schema === 'object' && schema !== null) {
    if (schema.parse) {
      return parseValue(data, schema.parse, functions)
    }
    if (schema.oneOf) {
      data = parseConditions(ajv, data, schema.oneOf, functions)
    }
    if (schema.anyOf) {
      data = parseConditions(ajv, data, schema.anyOf, functions)
    }
    if (schema.type === 'object') {
      return parseObject(ajv, data, schema, functions)
    } else if (schema.type === 'array') {
      return parseArray(ajv, data, schema, functions)
    }
  }
  return data
}
