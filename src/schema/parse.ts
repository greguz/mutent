import { MutentSchema, PrivateSchema } from './definition-type'

function parseArray (array: any[], schema: PrivateSchema): any {
  const { items } = schema
  if (!items) {
    return array
  }

  const length = Array.isArray(items) ? items.length : array.length
  for (let i = 0; i < length; i++) {
    array[i] = parseValues(
      array[i],
      Array.isArray(items) ? items[i] : items
    )
  }

  return array
}

function parsePatternProperties (
  object: any,
  patternProperties: NonNullable<PrivateSchema['patternProperties']>
): any {
  const objectKeys = Object.keys(object)

  for (const schemaKey of Object.keys(patternProperties)) {
    const regexp = new RegExp(schemaKey)

    for (const objectKey of objectKeys) {
      if (regexp.test(objectKey)) {
        object[objectKey] = parseValues(
          object[objectKey],
          patternProperties[schemaKey]
        )
      }
    }
  }

  return object
}

function parseProperties (
  object: any,
  properties: NonNullable<PrivateSchema['properties']>
): any {
  for (const key of Object.keys(properties)) {
    object[key] = parseValues(object[key], properties[key])
  }
  return object
}

function parseObject (object: any, schema: PrivateSchema): any {
  const { patternProperties, properties } = schema
  if (patternProperties) {
    object = parsePatternProperties(object, patternProperties)
  }
  if (properties) {
    object = parseProperties(object, properties)
  }
  return object
}

export function parseValues<T = any> (value: any, schema?: MutentSchema): T {
  if (typeof schema === 'object' && schema !== null) {
    if (schema.parse) {
      return schema.parse(value)
    } else if (schema.type === 'object') {
      return parseObject(value, schema)
    } else if (schema.type === 'array') {
      return parseArray(value, schema)
    }
  }
  return value
}
