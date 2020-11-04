import Ajv from 'ajv'
import Herry from 'herry'

import { parseData } from './schema/parse-data'

function defaultAjv() {
  return new Ajv({
    coerceTypes: true,
    nullable: true,
    removeAdditional: true,
    useDefaults: true
  })
}

function setAjvKeyword(ajv, keyword, definition) {
  if (ajv.getKeyword(keyword)) {
    throw new Herry(
      'EMUT_RESERVED_KEYWORD',
      'This custom keyword definition is reserved',
      { ajv, keyword }
    )
  }
  ajv.addKeyword(keyword, definition)
}

function hasOwnProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

class Schema {
  constructor(ajv, parsers, schema) {
    this._ajv = ajv
    this._parsers = parsers
    this._schema = schema

    this._validate = this._ajv.compile(schema)
  }

  validate(
    data,
    code = 'EMUT_INVALID_DATA',
    message = 'Invalid data detected'
  ) {
    if (!this._validate(data)) {
      throw new Herry(code, message, {
        data,
        errors: this._validate.errors,
        schema: this._schema
      })
    }
  }

  parse(data, code, message) {
    this.validate(data, code, message)
    return parseData(this._ajv, data, this._schema, this._parsers)
  }
}

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

    this._parsers = { ...parsers }

    this._ajv = ajv || defaultAjv()

    setAjvKeyword(this._ajv, 'instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate: (schema, data) => {
        return hasOwnProperty(this._constructors, schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    setAjvKeyword(this._ajv, 'parse', {
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
    return new Schema(this._ajv, this._parsers, schema)
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
