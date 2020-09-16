import { MutentSchema, PrivateSchema } from './definition-type'
import { ParseFunctions, parseValue } from './parse-value'

function parseArray(
  array: any[],
  schema: PrivateSchema,
  functions?: ParseFunctions
): any {
  const { items } = schema
  if (!items) {
    return array
  }

  const length = Array.isArray(items) ? items.length : array.length
  for (let i = 0; i < length; i++) {
    array[i] = parseData(
      array[i],
      Array.isArray(items) ? items[i] : items,
      functions
    )
  }

  return array
}

function parsePatternProperties(
  object: any,
  patternProperties: NonNullable<PrivateSchema['patternProperties']>,
  functions?: ParseFunctions
): any {
  const objectKeys = Object.keys(object)

  for (const schemaKey of Object.keys(patternProperties)) {
    const regexp = new RegExp(schemaKey)

    for (const objectKey of objectKeys) {
      if (regexp.test(objectKey)) {
        object[objectKey] = parseData(
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
  object: any,
  properties: NonNullable<PrivateSchema['properties']>,
  functions?: ParseFunctions
): any {
  for (const key of Object.keys(properties)) {
    object[key] = parseData(object[key], properties[key], functions)
  }
  return object
}

function parseObject(
  object: any,
  schema: PrivateSchema,
  functions?: ParseFunctions
): any {
  const { patternProperties, properties } = schema
  if (patternProperties) {
    object = parsePatternProperties(object, patternProperties, functions)
  }
  if (properties) {
    object = parseProperties(object, properties, functions)
  }
  return object
}

export function parseData<T = any>(
  data: any,
  schema?: MutentSchema,
  functions?: ParseFunctions
): T {
  if (typeof schema === 'object' && schema !== null) {
    if (schema.parse) {
      return parseValue(data, schema.parse, functions)
    } else if (schema.type === 'object') {
      return parseObject(data, schema, functions)
    } else if (schema.type === 'array') {
      return parseArray(data, schema, functions)
    }
  }
  return data
}
