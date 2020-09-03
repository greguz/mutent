import type { MutentSchema, PrivateSchema } from './definition-type'

interface Key {
  match: string | RegExp
  schema: any
}

interface Value {
  key: string
  schema: any
  value: any
}

function getKeys (obj: any = {}, isPattern: boolean = false): Key[] {
  return Object.keys(obj).map(key => ({
    match: isPattern ? new RegExp(key) : key,
    schema: obj[key]
  }))
}

function getObjectValues (obj: any, schema: any): Value[] {
  const items = getKeys(schema.properties)
    .concat(getKeys(schema.patternProperties, true))

  const values: Value[] = []

  for (const key of Object.keys(obj)) {
    const item = items.find(item => {
      return typeof item.match === 'string'
        ? item.match === key
        : item.match.test(key)
    })

    if (item || schema.additionalProperties === true) {
      values.push({
        key,
        schema: item ? item.schema : undefined,
        value: obj[key]
      })
    }
  }

  return values
}

function getArrayValues (obj: any[], schema: PrivateSchema): Value[] {
  const length: number = schema.additionalItems === true
    ? obj.length
    : (schema.items as MutentSchema[]).length

  const values: Value[] = []
  for (let i = 0; i < length; i++) {
    values.push({
      key: i.toString(),
      schema: (schema.items as MutentSchema[])[i],
      value: obj[i]
    })
  }
  return values
}

function set (obj: any, key: string, value: any): any {
  obj[key] = value
  return obj
}

export function parseObject <R> (obj: any, schema: MutentSchema = {}): R {
  if (typeof schema === 'boolean') {
    return obj
  }
  if (schema.parse) {
    return schema.parse(obj)
  } else if (schema.type === 'object') {
    return getObjectValues(obj, schema).reduce(
      (acc, item) => set(
        acc,
        item.key,
        parseObject(item.value, item.schema)
      ),
      {} as any
    )
  } else if (schema.type === 'array') {
    return Array.isArray(schema.items)
      ? getArrayValues(obj, schema).map(item => parseObject(item.value, item.schema))
      : obj.map((item: any) => parseObject(item, schema.items as MutentSchema))
  } else {
    return obj
  }
}

export { MutentSchema } from './definition-type'
