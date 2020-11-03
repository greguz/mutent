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

class Engine {
  constructor({ ajv, constructors, parseFunctions } = {}) {
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

    this._parseFunctions = parseFunctions || {}

    this._ajv = ajv || defaultAjv()

    this._ajv.addKeyword('instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate: (schema, data) => {
        return Object.prototype.hasOwnProperty.call(this._constructors, schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    this._ajv.addKeyword('parse', {
      errors: false,
      validate(schema) {
        if (Array.isArray(schema)) {
          return schema.length >= 1 && typeof schema[0] === 'string'
        } else if (typeof schema === 'object' && schema !== null) {
          const keys = Object.keys(schema)
          return keys.length === 1 && Array.isArray(schema[keys[0]])
        } else {
          return typeof schema === 'function' || typeof schema === 'string'
        }
      }
    })
  }

  compile(schema) {
    return new SchemaHandler(this._ajv, this._parseFunctions, schema)
  }

  defineConstructor(key, fn) {
    this._constructors[key] = fn
    return this
  }

  defineParser(key, fn) {
    this._parseFunctions[key] = fn
    return this
  }
}

export function createEngine(settings) {
  return new Engine(settings)
}
