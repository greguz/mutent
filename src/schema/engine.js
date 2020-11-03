import Ajv from 'ajv'

import { SchemaHandler } from './handler'

function defaultAjv() {
  return new Ajv({
    coerceTypes: true,
    nullable: true,
    removeAdditional: true,
    useDefaults: true
  })
}

const hasOwnProperty = Object.prototype.hasOwnProperty

class Engine {
  constructor({ ajv, constructors, parsers } = {}) {
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

    this._parsers = parsers || {}

    this._ajv = ajv || defaultAjv()

    this._ajv.addKeyword('instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate: (schema, data) => {
        return hasOwnProperty.call(this._constructors, schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    this._ajv.addKeyword('parse', {
      errors: false,
      metaSchema: {
        type: ['array', 'string', 'object'],
        items: [{ type: 'string' }],
        minItems: 1,
        additionalItems: true,
        additionalProperties: { type: 'array' },
        minProperties: 1,
        maxProperties: 1
      }
    })
  }

  compile(schema) {
    return new SchemaHandler(this._ajv, this._parsers, schema)
  }

  defineConstructor(key, fn) {
    this._constructors[key] = fn
    return this
  }

  defineParser(key, fn) {
    this._parsers[key] = fn
    return this
  }
}

export function createEngine(settings) {
  return new Engine(settings)
}
