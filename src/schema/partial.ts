function partialize(schema: any): any {
  if (schema.type === 'object') {
    return {
      ...schema,
      required: []
    }
  } else {
    return schema
  }
}

function mapValues(object: any, iteratee: (value: any, key: string) => any) {
  const result: any = {}
  Object.keys(object).forEach(key => {
    result[key] = iteratee(object[key], key)
  })
  return result
}

export function createPartialSchema(schema: any): any {
  if (Array.isArray(schema)) {
    return schema.map(createPartialSchema)
  } else if (typeof schema === 'object' && schema !== null) {
    return mapValues(partialize(schema), createPartialSchema)
  } else {
    return schema
  }
}
