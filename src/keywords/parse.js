import { MutentError } from '../error'

function describeParser(value) {
  if (typeof value === 'string') {
    return {
      key: value,
      args: []
    }
  } else if (Array.isArray(value)) {
    return {
      key: '' + value[0],
      args: value.slice(1)
    }
  } else {
    const key = Object.keys(value)[0]
    return {
      key,
      args: value[key]
    }
  }
}

export function createParseKeyword(parsers) {
  return {
    keyword: 'parse',
    errors: 'full',
    modifying: true,
    metaSchema: {
      type: ['array', 'string', 'object'],
      minItems: 1,
      additionalProperties: { type: 'array' },
      minProperties: 1,
      maxProperties: 1
    },
    compile(schema) {
      const { key, args } = describeParser(schema)

      const parse = parsers[key]
      if (!parse) {
        throw new MutentError(
          'EMUT_UNKNOWN_PARSER',
          'Unknown parser required',
          { key, args }
        )
      }

      return function validate(data, ctx) {
        validate.errors = validate.errors || []

        try {
          ctx.parentData[ctx.parentDataProperty] = parse(data, ...args)
        } catch (err) {
          validate.errors.push({
            keyword: 'parse',
            dataPath: ctx.dataPath,
            schemaPath: '#/parse',
            params: {
              parser: key,
              arguments: args,
              error: err
            },
            message: 'Data parsing failed'
          })
        }
      }
    }
  }
}
