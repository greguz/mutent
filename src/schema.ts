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

function getValues (obj: any, schema: any): Value[] {
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
        schema: item ? item.schema : null,
        value: obj[key]
      })
    }
  }

  return values
}

function set (obj: any, key: string, value: any): any {
  obj[key] = value
  return obj
}

export function parseObject (obj: any, schema: any): any {
  if (schema.parse) {
    return schema.parse(obj)
  } else if (schema.type === 'object') {
    return getValues(obj, schema).reduce(
      (acc, item) => set(
        acc,
        item.key,
        item.schema ? parseObject(item.value, item.schema) : item.value
      ),
      {}
    )
  } else if (schema.type === 'array') {
    return obj.map((value: any) => parseObject(value, schema.items))
  } else {
    return obj
  }
}
