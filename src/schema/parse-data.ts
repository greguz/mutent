import Ajv from 'ajv'

import { JSONSchema7, JSONSchema7Definition } from './definition-type'
import { ParseFunctions, parseValue } from './parse-value'

function parseArray(
  ajv: Ajv.Ajv,
  data: any[],
  schema: JSONSchema7,
  functions?: ParseFunctions
): any {
  const { items } = schema
  if (!items) {
    return data
  }

  const length = Array.isArray(items) ? items.length : data.length
  for (let i = 0; i < length; i++) {
    data[i] = parseData(
      ajv,
      data[i],
      Array.isArray(items) ? items[i] : items,
      functions
    )
  }

  return data
}

function parsePatternProperties(
  ajv: Ajv.Ajv,
  data: any,
  patternProperties: JSONSchema7['patternProperties'] = {},
  functions?: ParseFunctions
): any {
  const objectKeys = Object.keys(data)

  for (const schemaKey of Object.keys(patternProperties)) {
    const regexp = new RegExp(schemaKey)

    for (const objectKey of objectKeys) {
      if (regexp.test(objectKey)) {
        const value = data[objectKey]
        if (value !== undefined) {
          data[objectKey] = parseData(
            ajv,
            value,
            patternProperties[schemaKey],
            functions
          )
        }
      }
    }
  }

  return data
}

function parseProperties(
  ajv: Ajv.Ajv,
  data: any,
  properties: JSONSchema7['properties'] = {},
  functions?: ParseFunctions
): any {
  for (const key of Object.keys(properties)) {
    const value = data[key]
    if (value !== undefined) {
      data[key] = parseData(ajv, data[key], properties[key], functions)
    }
  }
  return data
}

function parseObject(
  ajv: Ajv.Ajv,
  data: any,
  schema: JSONSchema7,
  functions?: ParseFunctions
): any {
  const { patternProperties, properties } = schema
  if (patternProperties) {
    data = parsePatternProperties(ajv, data, patternProperties, functions)
  }
  if (properties) {
    data = parseProperties(ajv, data, properties, functions)
  }
  return data
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

export function parseData(
  ajv: Ajv.Ajv,
  data: any,
  schema?: JSONSchema7Definition,
  functions?: ParseFunctions
): any {
  if (typeof schema === 'object' && schema !== null && data !== undefined) {
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
