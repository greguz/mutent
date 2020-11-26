import Ajv from 'ajv'

import { pushConstant } from './constants'
import { MutentError } from './error'

function ensureFunction(value) {
  if (typeof value !== 'function') {
    throw new Error('Not a function')
  }
  return value
}

function describeParser(value) {
  if (typeof value === 'string') {
    return {
      key: value,
      args: []
    }
  } else if (Array.isArray(value)) {
    return {
      key: value[0],
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

function defaultAjv(options) {
  return new Ajv({
    coerceTypes: true,
    nullable: true,
    removeAdditional: true,
    useDefaults: true,
    ...options
  })
}

function setAjvKeyword(ajv, keyword, definition) {
  if (ajv.getKeyword(keyword)) {
    throw new MutentError(
      'EMUT_RESERVED_KEYWORD',
      'This custom keyword definition is reserved',
      { ajv, keyword }
    )
  }
  ajv.addKeyword(keyword, definition)
}

function yes() {
  return true
}

function constantKeyword() {
  return {
    errors: false,
    metaSchema: {
      type: 'boolean'
    },
    compile(schema) {
      if (schema !== true) {
        return yes
      }

      return function validate(data, path, parentData, property, rootData) {
        pushConstant(rootData, path.substring(1), data)
        return true
      }
    }
  }
}

function instanceofKeyword(constructors) {
  return {
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

      return function validate(data, dataPath) {
        validate.errors = validate.errors || []

        if (data instanceof Constructor) {
          return true
        } else {
          validate.errors.push({
            keyword: 'instanceof',
            dataPath,
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

function parseKeyword(parsers) {
  return {
    errors: 'full',
    modifying: true,
    metaSchema: {
      type: ['array', 'string', 'object'],
      items: [{ type: 'string' }],
      minItems: 1,
      additionalItems: true,
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

      return function validate(data, dataPath, parentData, property) {
        validate.errors = validate.errors || []

        try {
          parentData[property] = parse(data, ...args)
        } catch (err) {
          validate.errors.push({
            keyword: 'parse',
            dataPath,
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

class Engine {
  constructor({ ajv, ajvOptions, constructors, parsers } = {}) {
    this._constructors = {
      Array,
      Buffer,
      Date,
      Function,
      Number,
      Object,
      Promise,
      RegExp,
      String,
      ...constructors
    }
    this._parsers = { ...parsers }
    this._ajv = ajv || defaultAjv(ajvOptions)

    setAjvKeyword(this._ajv, 'constant', constantKeyword())
    setAjvKeyword(
      this._ajv,
      'instanceof',
      instanceofKeyword(this._constructors)
    )
    setAjvKeyword(this._ajv, 'parse', parseKeyword(this._parsers))
  }

  compile(schema) {
    return this._ajv.compile(schema)
  }

  defineConstructor(key, fn) {
    this._constructors[key] = ensureFunction(fn)
    return this
  }

  defineParser(key, fn) {
    this._parsers[key] = ensureFunction(fn)
    return this
  }
}

export function createEngine(settings) {
  return new Engine(settings)
}
