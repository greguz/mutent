import { MutentError } from '../error'

export function createInstanceofKeyword(constructors) {
  return {
    keyword: 'instanceof',
    errors: true,
    metaSchema: {
      type: 'string'
    },
    compile(schema) {
      const Constructor = constructors[schema]
      if (!Constructor) {
        throw new MutentError(
          'EMUT_UNKNOWN_CONSTRUCTOR',
          'Unknown constructor described',
          { key: schema }
        )
      }

      return function validate(data, ctx) {
        validate.errors = validate.errors || []

        if (data instanceof Constructor) {
          return true
        } else {
          validate.errors.push({
            keyword: 'instanceof',
            instancePath: ctx.instancePath,
            schemaPath: '#/instanceof',
            params: {
              constructor: schema,
              data
            },
            message: `Expected instance of "${schema}"`
          })
        }
      }
    }
  }
}
